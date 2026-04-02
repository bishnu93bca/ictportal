<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubCategory\StoreSubCategoryRequest;
use App\Http\Requests\SubCategory\UpdateSubCategoryRequest;
use App\Models\SubCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SubCategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasPermission('categories.view'), 403);

        $query = SubCategory::with('category:id,name,slug')->withCount('equipmentModels');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', (bool) $request->input('status'));
        }

        $sortBy = in_array($request->input('sort_by'), ['name', 'slug', 'status', 'created_at', 'category_id'])
                     ? $request->input('sort_by', 'created_at')
                     : 'created_at';
        $sortDir = $request->input('sort_dir', 'desc') === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);

        $perPage = (int) $request->input('per_page', 15);
        $perPage = min(max($perPage, 5), 100);

        $subCategories = $query->paginate($perPage);

        return response()->json($subCategories);
    }

    public function store(StoreSubCategoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['slug'] ?? $data['name']);

        $subCategory = SubCategory::create($data);

        return response()->json([
            'message' => 'Sub-category created successfully.',
            'data' => $subCategory->load('category:id,name,slug'),
        ], 201);
    }

    public function show(Request $request, SubCategory $subCategory): JsonResponse
    {
        abort_unless($request->user()->hasPermission('categories.view'), 403);

        return response()->json(['data' => $subCategory->load('category:id,name,slug')]);
    }

    public function update(UpdateSubCategoryRequest $request, SubCategory $subCategory): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        }

        $subCategory->update($data);

        return response()->json([
            'message' => 'Sub-category updated successfully.',
            'data' => $subCategory->fresh()->load('category:id,name,slug'),
        ]);
    }

    public function destroy(Request $request, SubCategory $subCategory): JsonResponse
    {
        abort_unless($request->user()->hasPermission('categories.delete'), 403);

        if ($subCategory->equipmentModels()->exists()) {
            return response()->json([
                'message' => 'Cannot delete sub-category with equipment models. Remove models first.',
            ], 422);
        }

        $subCategory->delete();

        return response()->json(['message' => 'Sub-category deleted successfully.']);
    }
}
