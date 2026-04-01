<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Permission\StorePermissionRequest;
use App\Http\Requests\Permission\UpdatePermissionRequest;
use App\Models\Permission;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Permission::withCount('roles');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        if ($group = $request->string('group')->trim()->value()) {
            $query->where('group', $group);
        }

        $sortBy  = in_array($request->input('sort_by'), ['name', 'slug', 'group', 'created_at'])
            ? $request->input('sort_by', 'group')
            : 'group';
        $sortDir = $request->input('sort_dir', 'asc') === 'desc' ? 'desc' : 'asc';

        $query->orderBy($sortBy, $sortDir)->orderBy('name');

        $perPage = min((int) $request->input('per_page', 50), 200);

        return response()->json($query->paginate($perPage));
    }

    /** Return all permissions grouped — used for role assignment checkboxes. */
    public function grouped(): JsonResponse
    {
        $groups = Permission::orderBy('group')->orderBy('name')
            ->get()
            ->groupBy('group')
            ->map(fn ($items, $group) => [
                'group'       => $group,
                'permissions' => $items->values(),
            ])
            ->values();

        return response()->json(['data' => $groups]);
    }

    public function store(StorePermissionRequest $request): JsonResponse
    {
        $permission = Permission::create($request->validated());

        return response()->json([
            'message' => 'Permission created successfully.',
            'data'    => $permission,
        ], 201);
    }

    public function show(Permission $permission): JsonResponse
    {
        return response()->json(['data' => $permission->load('roles:id,name,slug')]);
    }

    public function update(UpdatePermissionRequest $request, Permission $permission): JsonResponse
    {
        $permission->update($request->validated());

        return response()->json([
            'message' => 'Permission updated successfully.',
            'data'    => $permission->fresh(),
        ]);
    }

    public function destroy(Request $request, Permission $permission): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $permission->delete();

        return response()->json(['message' => 'Permission deleted successfully.']);
    }
}
