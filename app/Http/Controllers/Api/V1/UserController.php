<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Traits\LogsActivity;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    use LogsActivity;

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $auth = $request->user();

        $query = User::query()
            ->select([
                'id', 'name', 'email', 'role', 'status',
                'avatar', 'phone', 'udise_code', 'school_name',
                'city', 'district', 'created_at', 'last_login_at',
            ])
            ->forDistrictAdmin($auth);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('udise_code', 'like', "%{$search}%")
                    ->orWhere('school_name', 'like', "%{$search}%");
            });
        }

        if ($role = $request->string('role')->trim()->value()) {
            $query->where('role', $role);
        }

        if ($status = $request->string('status')->trim()->value()) {
            $query->where('status', $status);
        }

        // District / block filters: super_admin & non-scoped admins only (district admins are already scoped server-side).
        if (! $auth->isDistrictScopedAdmin()) {
            if ($district = $request->string('district')->trim()->value()) {
                $query->whereRaw('LOWER(TRIM(COALESCE(district, ""))) = ?', [
                    mb_strtolower($district),
                ]);
            }

            if ($block = $request->string('block')->trim()->value()) {
                $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = ?', [
                    mb_strtolower($block),
                ]);
            }
        } elseif ($block = $request->string('block')->trim()->value()) {
            $query->whereRaw('LOWER(TRIM(COALESCE(city, ""))) = ?', [
                mb_strtolower($block),
            ]);
        }

        $perPage = (int) $request->input('per_page', 15);
        $paginator = $query->latest()->paginate($perPage);

        $payload = $paginator->toArray();
        $payload['list_scope'] = $auth->isDistrictScopedAdmin()
            ? [
                'district' => $auth->district,
                'state' => $auth->state,
            ]
            : null;

        return response()->json($payload);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);

        $user = User::create($data);

        $this->logCreate('users', "Created user [{$user->name}] ({$user->email}) role={$user->role}",
            AuditLogService::sanitize($user->toArray()));

        return response()->json(['message' => 'User created successfully.', 'user' => $user], 201);
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return response()->json(['user' => $user]);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $before = AuditLogService::sanitize($user->toArray());

        $data = $request->validated();

        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }

        // Only admins can change roles/status
        if (! $request->user()->isAdmin()) {
            unset($data['role'], $data['status']);
        }

        $user->update($data);

        $this->logUpdate('users', "Updated user [{$user->name}] (id={$user->id})",
            $before, AuditLogService::sanitize($user->fresh()->toArray()));

        return response()->json(['message' => 'User updated successfully.', 'user' => $user->fresh()]);
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $before = AuditLogService::sanitize($user->toArray());
        $user->delete();

        $this->logDelete('users', "Deleted user [{$user->name}] (id={$user->id})", $before);

        return response()->json(['message' => 'User deleted successfully.']);
    }

    /**
     * List soft-deleted users — super_admin only.
     */
    public function trashed(Request $request): JsonResponse
    {
        $this->authorize('forceDelete', new User);

        $query = User::onlyTrashed()->select([
            'id', 'name', 'email', 'role', 'status', 'avatar', 'deleted_at',
        ]);

        if ($search = $request->string('search')->trim()->value()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->latest('deleted_at')->paginate((int) $request->input('per_page', 15));

        return response()->json($users);
    }

    /**
     * Restore a soft-deleted user — super_admin only.
     */
    public function restore(int $id): JsonResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);

        $this->authorize('restore', $user);

        $user->restore();

        $this->logCreate('users', "Restored soft-deleted user [{$user->name}] (id={$user->id})");

        return response()->json(['message' => 'User restored successfully.', 'user' => $user]);
    }

    /**
     * Permanently delete a user — super_admin only.
     */
    public function forceDelete(int $id): JsonResponse
    {
        $user = User::onlyTrashed()->findOrFail($id);

        $this->authorize('forceDelete', $user);

        $before = AuditLogService::sanitize($user->toArray());
        $user->forceDelete();

        $this->logDelete('users', "Permanently deleted user [{$user->name}] (id={$user->id})", $before);

        return response()->json(['message' => 'User permanently deleted.']);
    }

    /**
     * Look up school name by UDISE code — searches the users table.
     * Used by the complaint form to auto-fill school name.
     */
    public function udiseLookup(Request $request): JsonResponse
    {
        $code = $request->string('code')->trim()->value();

        if (! $code) {
            return response()->json(['school_name' => null]);
        }

        $user = User::where('udise_code', $code)
            ->whereNotNull('school_name')
            ->first(['school_name']);

        return response()->json(['school_name' => $user?->school_name]);
    }

    /**
     * Return distinct districts (and optionally blocks for a district).
     */
    public function districts(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $auth = $request->user();
        $district = $request->string('district')->trim()->value();

        $base = User::query()->forDistrictAdmin($auth);

        if ($district !== '') {
            $blocks = (clone $base)
                ->whereRaw('LOWER(TRIM(COALESCE(district, ""))) = ?', [
                    mb_strtolower(trim($district)),
                ])
                ->whereNotNull('city')
                ->where('city', '!=', '')
                ->distinct()
                ->pluck('city')
                ->sort()
                ->values();

            return response()->json(['blocks' => $blocks]);
        }

        $districts = (clone $base)
            ->whereNotNull('district')
            ->where('district', '!=', '')
            ->distinct()
            ->pluck('district')
            ->sort()
            ->values();

        return response()->json(['districts' => $districts]);
    }

    public function profile(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->toApiArray()]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'avatar' => ['nullable', 'string', 'max:500'],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'country' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', 'string', 'in:male,female,other'],
            'school_name' => ['nullable', 'string', 'max:255'],
            'udise_code' => ['nullable', 'string', 'max:50'],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'confirmed'],
            'email_notifications' => ['sometimes', 'boolean'],
            'sms_notifications' => ['sometimes', 'boolean'],
            'push_notifications' => ['sometimes', 'boolean'],
        ]);

        if (isset($data['password']) && $data['password']) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        unset($data['password_confirmation']);

        $request->user()->update($data);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $request->user()->fresh()->toApiArray(),
        ]);
    }
}
