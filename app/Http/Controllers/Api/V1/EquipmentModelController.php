<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\EquipmentModel\StoreEquipmentModelRequest;
use App\Http\Requests\EquipmentModel\UpdateEquipmentModelRequest;
use App\Models\EquipmentModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EquipmentModelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasPermission('categories.view'), 403);

        $query = EquipmentModel::with(['subCategory:id,name,slug,category_id', 'subCategory.category:id,name,slug']);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($request->filled('sub_category_id')) {
            $query->where('sub_category_id', $request->integer('sub_category_id'));
        }

        if ($request->filled('category_id')) {
            $query->whereHas('subCategory', fn ($q) => $q->where('category_id', $request->integer('category_id')));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', (bool) $request->input('status'));
        }

        $sortBy = in_array($request->input('sort_by'), ['name', 'slug', 'status', 'created_at'], true)
            ? $request->input('sort_by', 'created_at')
            : 'created_at';
        $sortDir = $request->input('sort_dir', 'desc') === 'asc' ? 'asc' : 'desc';

        $query->orderBy($sortBy, $sortDir);

        $perPage = min(max((int) $request->input('per_page', 15), 5), 100);

        return response()->json($query->paginate($perPage));
    }

    /** Active models for a sub-category (complaint form dropdown). */
    public function forSubCategory(int $subCategoryId): JsonResponse
    {
        $models = EquipmentModel::query()
            ->where('sub_category_id', $subCategoryId)
            ->active()
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return response()->json(['data' => $models]);
    }

    public function store(StoreEquipmentModelRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['slug'] = Str::slug($data['slug'] ?? $data['name']);
        $data['status'] = $data['status'] ?? true;

        $model = EquipmentModel::create($data);

        return response()->json([
            'message' => 'Equipment model created successfully.',
            'data' => $model->load(['subCategory:id,name,slug,category_id', 'subCategory.category:id,name,slug']),
        ], 201);
    }

    public function show(Request $request, EquipmentModel $equipmentModel): JsonResponse
    {
        abort_unless($request->user()->hasPermission('categories.view'), 403);

        return response()->json([
            'data' => $equipmentModel->load(['subCategory:id,name,slug,category_id', 'subCategory.category:id,name,slug']),
        ]);
    }

    public function update(UpdateEquipmentModelRequest $request, EquipmentModel $equipmentModel): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        } elseif (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $equipmentModel->update($data);

        return response()->json([
            'message' => 'Equipment model updated successfully.',
            'data' => $equipmentModel->fresh()->load(['subCategory:id,name,slug,category_id', 'subCategory.category:id,name,slug']),
        ]);
    }

    public function destroy(Request $request, EquipmentModel $equipmentModel): JsonResponse
    {
        abort_unless($request->user()->hasPermission('categories.delete'), 403);

        if ($equipmentModel->complaints()->exists()) {
            return response()->json([
                'message' => 'Cannot delete: this model is referenced by complaints.',
            ], 422);
        }

        $equipmentModel->delete();

        return response()->json(['message' => 'Equipment model deleted successfully.']);
    }
}
