<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RoleController extends Controller
{
    /* ─── Roles CRUD ─────────────────────────────────────────────── */

    public function index(Request $request): JsonResponse
    {
        $query = Role::withCount('permissions', 'users');

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $roles = $query->orderBy('name')->paginate((int) $request->input('per_page', 20));

        return response()->json($roles);
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $data         = $request->validated();
        $data['slug'] = Str::slug($data['slug'] ?? $data['name']);

        $shouldSyncPermissions = array_key_exists('permissions', $data);
        $permissionIds         = $data['permissions'] ?? [];
        unset($data['permissions']);

        $role = Role::create($data);

        if ($shouldSyncPermissions) {
            $role->syncPermissions($permissionIds);
        }

        return response()->json([
            'message' => 'Role created successfully.',
            'data'    => $role->loadCount('permissions', 'users'),
        ], 201);
    }

    public function show(Role $role): JsonResponse
    {
        $role->load('permissions:id,name,slug,group');
        $role->loadCount('users');

        return response()->json(['data' => $role]);
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        $data = $request->validated();

        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        }

        $shouldSyncPermissions = array_key_exists('permissions', $data);
        $permissionIds         = $data['permissions'] ?? [];
        unset($data['permissions']);

        $role->update($data);

        if ($shouldSyncPermissions) {
            $role->syncPermissions($permissionIds);
        }

        return response()->json([
            'message' => 'Role updated successfully.',
            'data'    => $role->fresh()->loadCount('permissions', 'users'),
        ]);
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        if ($role->is_system) {
            return response()->json(['message' => 'System roles cannot be deleted.'], 422);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted successfully.']);
    }

    /* ─── Role → Permission assignments ─────────────────────────── */

    /** List all permissions, marking which ones are assigned to this role. */
    public function permissions(Role $role): JsonResponse
    {
        $assigned = $role->permissions()->pluck('permission_id')->all();

        $permissions = Permission::orderBy('group')->orderBy('name')->get()
            ->groupBy('group')
            ->map(fn ($items, $group) => [
                'group'       => $group,
                'permissions' => $items->map(fn ($p) => [
                    'id'          => $p->id,
                    'name'        => $p->name,
                    'slug'        => $p->slug,
                    'description' => $p->description,
                    'assigned'    => in_array($p->id, $assigned, true),
                ])->values(),
            ])->values();

        return response()->json(['data' => $permissions]);
    }

    /** Sync all permissions for a role at once. */
    public function syncPermissions(Request $request, Role $role): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $request->validate([
            'permissions'   => ['required', 'array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role->syncPermissions($request->input('permissions'));

        return response()->json([
            'message' => 'Permissions updated.',
            'data'    => $role->load('permissions:id,name,slug,group')->loadCount('permissions'),
        ]);
    }

    /** Add a single permission to a role. */
    public function assignPermission(Request $request, Role $role, Permission $permission): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $role->givePermission($permission);

        return response()->json(['message' => "Permission '{$permission->slug}' assigned."]);
    }

    /** Remove a single permission from a role. */
    public function revokePermission(Request $request, Role $role, Permission $permission): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $role->revokePermission($permission);

        return response()->json(['message' => "Permission '{$permission->slug}' revoked."]);
    }

    /* ─── User → Role assignments ────────────────────────────────── */

    public function userRoles(User $user): JsonResponse
    {
        $assigned = $user->roles()->pluck('role_id')->all();

        $roles = Role::orderBy('name')->get()->map(fn ($r) => [
            'id'          => $r->id,
            'name'        => $r->name,
            'slug'        => $r->slug,
            'description' => $r->description,
            'is_system'   => $r->is_system,
            'assigned'    => in_array($r->id, $assigned, true),
        ]);

        return response()->json(['data' => $roles]);
    }

    public function syncUserRoles(Request $request, User $user): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $request->validate([
            'roles'   => ['required', 'array'],
            'roles.*' => ['integer', 'exists:roles,id'],
        ]);

        $user->syncRoles($request->input('roles'));

        return response()->json([
            'message' => 'User roles updated.',
            'data'    => $user->roles()->get(['roles.id', 'roles.name', 'roles.slug']),
        ]);
    }

    public function assignUserRole(Request $request, User $user, Role $role): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $user->assignRole($role);

        return response()->json(['message' => "Role '{$role->slug}' assigned to user."]);
    }

    public function removeUserRole(Request $request, User $user, Role $role): JsonResponse
    {
        abort_unless($request->user()->isSuperAdmin(), 403);

        $user->removeRole($role);

        return response()->json(['message' => "Role '{$role->slug}' removed from user."]);
    }

    /** Return the effective permission slugs for a user. */
    public function userPermissions(User $user): JsonResponse
    {
        return response()->json([
            'data' => $user->getAllPermissions(),
        ]);
    }
}
