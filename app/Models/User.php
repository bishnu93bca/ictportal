<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    public const ROLES = [
        'super_admin',
        'admin',
        'manager',
        'teacher',
        'staff',
        'student',
        'parent',
        'guest',
    ];

    public const STATUSES = ['active', 'inactive', 'suspended'];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'avatar',
        'gender',
        'date_of_birth',
        'udise_code',
        'school_name',
        'phone',
        'address',
        'city',
        'district',
        'state',
        'country',
        'postal_code',
        'email_notifications',
        'sms_notifications',
        'push_notifications',
        'fcm_token',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'last_login_at' => 'datetime',
            'locked_until' => 'datetime',
            'date_of_birth' => 'date',
            'password' => 'hashed',
            'email_notifications' => 'boolean',
            'sms_notifications' => 'boolean',
            'push_notifications' => 'boolean',
            'failed_login_attempts' => 'integer',
        ];
    }

    /* ─── Primary-role helpers (backward compat) ──────────────────── */

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['admin', 'super_admin'], true);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'super_admin';
    }

    /**
     * Non–super-admin admins with a district set only manage data for that district.
     */
    public function isDistrictScopedAdmin(): bool
    {
        return $this->isAdmin() && ! $this->isSuperAdmin() && filled($this->district);
    }

    /**
     * Limit user listings to the same district as this admin (super admin / admin without district: no restriction).
     */
    public function scopeForDistrictAdmin(Builder $query, User $admin): Builder
    {
        if (! $admin->isDistrictScopedAdmin()) {
            return $query;
        }

        return $query->whereRaw('LOWER(TRIM(COALESCE(users.district, ""))) = ?', [
            mb_strtolower(trim((string) $admin->district)),
        ]);
    }

    public function districtMatches(?string $otherDistrict): bool
    {
        if (! filled($this->district) || $otherDistrict === null || $otherDistrict === '') {
            return false;
        }

        return strcasecmp(trim($this->district), trim($otherDistrict)) === 0;
    }

    /** Whether this admin may view/edit another user in admin screens (district-scoped admins are limited). */
    public function canAccessUserInManagementScope(self $target): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (! $this->isDistrictScopedAdmin()) {
            return true;
        }

        return $this->districtMatches($target->district);
    }

    /**
     * District admin (role admin, active) for a given district — used for coordinator / copy templates.
     *
     * @return array{name: string, phone: ?string, email: string, district: ?string}|null
     */
    public static function districtAdminPayload(?string $district): ?array
    {
        if ($district === null || trim($district) === '') {
            return null;
        }

        $normalized = mb_strtolower(trim($district));

        $admin = static::query()
            ->where('role', 'admin')
            ->where('status', 'active')
            ->whereRaw('LOWER(TRIM(COALESCE(users.district, ""))) = ?', [$normalized])
            ->orderBy('id')
            ->first(['id', 'name', 'email', 'phone', 'district']);

        if ($admin === null) {
            return null;
        }

        return [
            'name' => $admin->name,
            'phone' => $admin->phone,
            'email' => $admin->email,
            'district' => $admin->district,
        ];
    }

    /** Whether this admin may view/update a complaint filed by a teacher (district match). */
    public function canManageComplaint(Complaint $complaint): bool
    {
        if (! $this->isAdmin()) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        if (! $this->isDistrictScopedAdmin()) {
            return true;
        }

        $complaint->loadMissing('user');

        return $this->districtMatches($complaint->user?->district);
    }

    /* ─── RBAC relationships ───────────────────────────────────────── */

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            Role::class,
            'user_roles',
            'user_id',
            'role_id'
        )->withPivot('assigned_at');
    }

    /* ─── Permission helpers ───────────────────────────────────────── */

    /** Returns all permission slugs granted to this user via their assigned roles. */
    public function getAllPermissions(): array
    {
        if ($this->isSuperAdmin()) {
            return ['*']; // super_admin bypasses all checks
        }

        return Cache::remember(
            "user_permissions_{$this->id}",
            now()->addMinutes(10),
            fn () => $this->roles()
                ->with('permissions:id,slug')
                ->get()
                ->flatMap(fn (Role $role) => $role->permissions->pluck('slug'))
                ->unique()
                ->values()
                ->all()
        );
    }

    public function hasPermission(string $slug): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return in_array($slug, $this->getAllPermissions(), true);
    }

    public function hasAnyPermission(string ...$slugs): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        $userPerms = $this->getAllPermissions();
        foreach ($slugs as $slug) {
            if (in_array($slug, $userPerms, true)) {
                return true;
            }
        }

        return false;
    }

    /** Assign a role by slug or Role model. */
    public function assignRole(Role|string $role): void
    {
        $model = $role instanceof Role
            ? $role
            : Role::where('slug', $role)->firstOrFail();

        $this->roles()->syncWithoutDetaching([$model->id => ['assigned_at' => now()]]);
        $this->flushPermissionCache();
    }

    /** Remove a role by slug or Role model. */
    public function removeRole(Role|string $role): void
    {
        $model = $role instanceof Role
            ? $role
            : Role::where('slug', $role)->firstOrFail();

        $this->roles()->detach($model->id);
        $this->flushPermissionCache();
    }

    /** Sync roles — replaces all current role assignments. */
    public function syncRoles(array $roleIds): void
    {
        $pivot = collect($roleIds)->mapWithKeys(
            fn ($id) => [$id => ['assigned_at' => now()]]
        )->all();

        $this->roles()->sync($pivot);
        $this->flushPermissionCache();
    }

    public function flushPermissionCache(): void
    {
        Cache::forget("user_permissions_{$this->id}");
    }

    /**
     * User JSON for API clients (includes RBAC slugs for dynamic UI).
     *
     * @return array<string, mixed>
     */
    public function toApiArray(): array
    {
        return array_merge($this->toArray(), [
            'permissions' => $this->getAllPermissions(),
        ]);
    }
}
