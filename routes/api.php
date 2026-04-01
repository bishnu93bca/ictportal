<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CategoryController;
use App\Http\Controllers\Api\V1\ComplaintController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\SubCategoryController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — v1
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->name('v1.')->group(function () {

    // ── Public Auth Routes ──────────────────────────────────────────────
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('register',        [AuthController::class, 'register'])->name('register')->middleware('throttle:10,1');
        Route::post('login',           [AuthController::class, 'login'])->name('login')->middleware('throttle:6,1');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->name('forgot-password')->middleware('throttle:5,1');
        Route::post('reset-password',  [AuthController::class, 'resetPassword'])->name('reset-password')->middleware('throttle:5,1');
    });

    // ── Authenticated Routes ────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::get('me',     [AuthController::class, 'me'])->name('me');
        });

        // Dashboard
        Route::get('dashboard/stats', [DashboardController::class, 'stats'])->name('dashboard.stats');

        // Profile (before users resource to avoid {user} swallowing "profile")
        Route::get('profile',        [UserController::class, 'profile'])->name('profile.show');
        Route::put('profile',        [UserController::class, 'updateProfile'])->name('profile.update');

        // Soft-deleted user routes MUST come before apiResource so that
        // "GET /users/trashed" is not matched by "GET /users/{user}"
        Route::prefix('users')->name('users.')->group(function () {
            Route::get('trashed',          [UserController::class, 'trashed'])->name('trashed');
            Route::post('{id}/restore',    [UserController::class, 'restore'])->name('restore');
            Route::delete('{id}/force',    [UserController::class, 'forceDelete'])->name('force-delete');
        });

        // Users resource (registered after the fixed static routes above)
        Route::apiResource('users', UserController::class);

        // UDISE code lookup (auto-fill school name in complaint form)
        Route::get('udise/lookup', [UserController::class, 'udiseLookup'])->name('udise.lookup');

        // District / block lookup (for filters)
        Route::get('users/districts', [UserController::class, 'districts'])->name('users.districts');

        // ── RBAC — super_admin only ────────────────────────────────────
        Route::middleware('permission:roles.view')->group(function () {

            // Roles CRUD
            Route::apiResource('roles', RoleController::class);

            // Role ↔ Permission assignments
            Route::get ('roles/{role}/permissions',                [RoleController::class, 'permissions'])->name('roles.permissions');
            Route::post('roles/{role}/permissions/sync',           [RoleController::class, 'syncPermissions'])->name('roles.permissions.sync');
            Route::post('roles/{role}/permissions/{permission}',   [RoleController::class, 'assignPermission'])->name('roles.permissions.assign');
            Route::delete('roles/{role}/permissions/{permission}', [RoleController::class, 'revokePermission'])->name('roles.permissions.revoke');

            // Permissions CRUD
            Route::get('permissions/grouped', [PermissionController::class, 'grouped'])->name('permissions.grouped');
            Route::apiResource('permissions', PermissionController::class);
        });

        // User ↔ Role assignments (super_admin only via controller guards)
        Route::get   ('users/{user}/roles',           [RoleController::class, 'userRoles'])->name('users.roles.index');
        Route::post  ('users/{user}/roles/sync',      [RoleController::class, 'syncUserRoles'])->name('users.roles.sync');
        Route::post  ('users/{user}/roles/{role}',    [RoleController::class, 'assignUserRole'])->name('users.roles.assign');
        Route::delete('users/{user}/roles/{role}',    [RoleController::class, 'removeUserRole'])->name('users.roles.remove');
        Route::get   ('users/{user}/permissions',     [RoleController::class, 'userPermissions'])->name('users.permissions');

        // Categories (all active, for dropdowns)
        Route::get('categories/all', [CategoryController::class, 'all'])->name('categories.all');

        // Categories resource
        Route::apiResource('categories', CategoryController::class);

        // Sub-categories resource
        Route::apiResource('sub-categories', SubCategoryController::class);

        // Audit Logs — super_admin only
        Route::prefix('audit-logs')->name('audit-logs.')->group(function () {
            Route::get('/',        [AuditLogController::class, 'index'])->name('index');
            Route::get('stats',    [AuditLogController::class, 'stats'])->name('stats');
            Route::get('{auditLog}', [AuditLogController::class, 'show'])->name('show');
        });

        // Complaints
        Route::prefix('complaints')->name('complaints.')->group(function () {
            Route::get('/',              [ComplaintController::class, 'index'])->name('index');
            Route::post('/',             [ComplaintController::class, 'store'])->name('store');
            Route::get('{complaint}',    [ComplaintController::class, 'show'])->name('show');
            Route::put('{complaint}',    [ComplaintController::class, 'update'])->name('update');
            Route::patch('{complaint}/status',                        [ComplaintController::class, 'updateStatus'])->name('status');
            Route::delete('{complaint}',                              [ComplaintController::class, 'destroy'])->name('destroy');
            // Attachments
            Route::post('{complaint}/attachments',                    [ComplaintController::class, 'storeAttachment'])->name('attachments.store');
            Route::delete('{complaint}/attachments/{attachment}',     [ComplaintController::class, 'destroyAttachment'])->name('attachments.destroy');
        });
    });
});
