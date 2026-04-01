<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\StoreCategoryRequest;
use App\Http\Requests\Category\UpdateCategoryRequest;
use App\Http\Traits\LogsActivity;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    use LogsActivity;
    public function index(Request $request): JsonResponse
    {
        $query = Category::withCount('subCategories');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', (bool) $request->input('status'));
        }

        $sortBy  = in_array($request->input('sort_by'), ['name', 'slug', 'status', 'created_at'])
                     ? $request->input('sort_by', 'created_at')
                     : 'created_at';
        $sortDir = $request->input('sort_dir', 'desc') === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);

        $perPage = (int) $request->input('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        $categories = $query->paginate($perPage);

        return response()->json($categories);
    }

    /** Return all active categories for dropdowns. */
    public function all(): JsonResponse
    {
        $categories = Category::active()->orderBy('name')->get(['id', 'name', 'slug']);

        return response()->json(['data' => $categories]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $data         = $request->validated();
        $data['slug'] = Str::slug($data['slug'] ?? $data['name']);

        $category = Category::create($data);

        $this->logCreate('categories', "Category created: \"{$category->name}\" (slug={$category->slug})",
            $category->toArray());

        return response()->json([
            'message' => 'Category created successfully.',
            'data'    => $category->loadCount('subCategories'),
        ], 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json(['data' => $category->loadCount('subCategories')]);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $before = $category->toArray();
        $data   = $request->validated();

        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        }

        $category->update($data);

        $this->logUpdate('categories', "Category updated: \"{$category->name}\"",
            $before, $category->fresh()->toArray());

        return response()->json([
            'message' => 'Category updated successfully.',
            'data'    => $category->fresh()->loadCount('subCategories'),
        ]);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403, 'Only super admins can delete categories.');

        if ($category->subCategories()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with existing sub-categories. Remove sub-categories first.',
            ], 422);
        }

        $before = $category->toArray();
        $category->delete();

        $this->logDelete('categories', "Category deleted: \"{$category->name}\" (slug={$category->slug})", $before);

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
