<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'description', 'is_system'];

    protected $casts = [
        'is_system' => 'boolean',
    ];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(
            Permission::class,
            'role_permissions',
            'role_id',
            'permission_id'
        );
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(
            User::class,
            'user_roles',
            'role_id',
            'user_id'
        )->withPivot('assigned_at');
    }

    public function givePermission(Permission|int $permission): void
    {
        $id = $permission instanceof Permission ? $permission->id : $permission;
        $this->permissions()->syncWithoutDetaching([$id]);
        $this->flushPermissionCache();
    }

    public function revokePermission(Permission|int $permission): void
    {
        $id = $permission instanceof Permission ? $permission->id : $permission;
        $this->permissions()->detach($id);
        $this->flushPermissionCache();
    }

    public function syncPermissions(array $permissionIds): void
    {
        $this->permissions()->sync($permissionIds);
        $this->flushPermissionCache();
    }

    /** Clear cached permissions for all users who hold this role. */
    public function flushPermissionCache(): void
    {
        $this->users()->pluck('user_id')->each(function (int $userId) {
            \Illuminate\Support\Facades\Cache::forget("user_permissions_{$userId}");
        });
    }
}
