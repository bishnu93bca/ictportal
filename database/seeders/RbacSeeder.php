<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Cache;

class RbacSeeder extends Seeder
{
    /**
     * Permission catalogue — grouped by module.
     * Slug format:  <module>.<action>
     */
    private const PERMISSIONS = [
        'dashboard' => [
            ['slug' => 'dashboard.view',   'name' => 'View Dashboard'],
        ],
        'users' => [
            ['slug' => 'users.view',       'name' => 'View Users'],
            ['slug' => 'users.create',     'name' => 'Create Users'],
            ['slug' => 'users.edit',       'name' => 'Edit Users'],
            ['slug' => 'users.delete',     'name' => 'Delete Users'],
            ['slug' => 'users.restore',    'name' => 'Restore Deleted Users'],
        ],
        'complaints' => [
            ['slug' => 'complaints.view',          'name' => 'View Complaints'],
            ['slug' => 'complaints.create',        'name' => 'Create Complaints'],
            ['slug' => 'complaints.edit',          'name' => 'Edit Complaints'],
            ['slug' => 'complaints.delete',        'name' => 'Delete Complaints'],
            ['slug' => 'complaints.manage-status', 'name' => 'Manage Complaint Status'],
        ],
        'categories' => [
            ['slug' => 'categories.view',   'name' => 'View Categories'],
            ['slug' => 'categories.create', 'name' => 'Create Categories'],
            ['slug' => 'categories.edit',   'name' => 'Edit Categories'],
            ['slug' => 'categories.delete', 'name' => 'Delete Categories'],
        ],
        'roles' => [
            ['slug' => 'roles.view',        'name' => 'View Roles & Permissions'],
            ['slug' => 'roles.create',      'name' => 'Create Roles'],
            ['slug' => 'roles.edit',        'name' => 'Edit Roles'],
            ['slug' => 'roles.delete',      'name' => 'Delete Roles'],
            ['slug' => 'roles.assign',      'name' => 'Assign Roles to Users'],
            ['slug' => 'permissions.view',  'name' => 'View Permissions'],
            ['slug' => 'permissions.manage', 'name' => 'Manage Permissions'],
        ],
    ];

    /**
     * Role definitions — permissions granted per role.
     * super_admin bypasses all checks in middleware, so no explicit permissions needed.
     */
    private const ROLE_PERMISSIONS = [
        'super_admin' => '*', // wildcard — granted all at seeding time
        'admin' => [
            'dashboard.view',
            'users.view', 'users.edit',
            'complaints.view', 'complaints.create', 'complaints.edit',
            'complaints.delete', 'complaints.manage-status',
            'categories.view', 'categories.create', 'categories.edit', 'categories.delete',
            'roles.view',
        ],
        'manager' => [
            'dashboard.view',
            'users.view',
            'complaints.view', 'complaints.manage-status',
            'categories.view',
        ],
        'teacher' => [
            'dashboard.view',
            'complaints.view', 'complaints.create', 'complaints.edit', 'complaints.delete',
            'categories.view',
        ],
        'staff' => [
            'dashboard.view',
            'complaints.view', 'complaints.create',
            'categories.view',
        ],
        'student' => [
            'dashboard.view',
            'complaints.view', 'complaints.create',
            'categories.view',
        ],
        'parent' => [
            'dashboard.view',
            'complaints.view', 'complaints.create',
            'categories.view',
        ],
        'guest' => [
            'dashboard.view',
        ],
    ];

    public function run(): void
    {
        // ── 1. Seed permissions ──────────────────────────────────────
        $permMap = []; // slug → Permission model

        foreach (self::PERMISSIONS as $group => $items) {
            foreach ($items as $item) {
                $perm = Permission::updateOrCreate(
                    ['slug' => $item['slug']],
                    [
                        'name' => $item['name'],
                        'group' => $group,
                    ]
                );
                $permMap[$item['slug']] = $perm;
            }
        }

        // ── 2. Seed roles and assign permissions ─────────────────────
        foreach (self::ROLE_PERMISSIONS as $slug => $permSlugs) {
            $role = Role::updateOrCreate(
                ['slug' => $slug],
                [
                    'name' => ucwords(str_replace('_', ' ', $slug)),
                    'is_system' => true,
                ]
            );

            if ($permSlugs === '*') {
                // Assign all permissions
                $role->permissions()->sync(
                    collect($permMap)->pluck('id')->all()
                );
            } else {
                $ids = collect($permSlugs)
                    ->map(fn ($s) => $permMap[$s]?->id)
                    ->filter()
                    ->values()
                    ->all();

                $role->permissions()->sync($ids);
            }
        }

        // ── 3. Assign RBAC roles to existing users based on primary role ──
        $userRoleMap = User::withTrashed()->get(['id', 'role']);

        foreach ($userRoleMap as $user) {
            $roleModel = Role::where('slug', $user->role)->first();
            if ($roleModel) {
                \DB::table('user_roles')->insertOrIgnore([
                    'user_id' => $user->id,
                    'role_id' => $roleModel->id,
                    'assigned_at' => now(),
                ]);
                // Flush any cached permissions
                Cache::forget("user_permissions_{$user->id}");
            }
        }
    }
}
