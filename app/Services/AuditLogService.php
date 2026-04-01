<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Reusable audit logging service.
 *
 * Usage:
 *   AuditLogService::log('CREATE', 'users', 'Created user John Doe', null, $user->toArray());
 *   AuditLogService::log('UPDATE', 'complaints', 'Updated complaint #5', $before, $after);
 *   AuditLogService::log('DELETE', 'categories', 'Deleted category Hardware');
 *   AuditLogService::log('LOGIN',  'auth', 'User logged in');
 *   AuditLogService::log('LOGOUT', 'auth', 'User logged out');
 *
 * Always returns a boolean. Exceptions are caught and swallowed so the main
 * application flow is never interrupted by a logging failure.
 */
class AuditLogService
{
    /**
     * Record an audit event.
     *
     * @param  string        $action      One of: CREATE, UPDATE, DELETE, LOGIN, LOGOUT
     * @param  string        $module      Resource/module name (e.g. 'users', 'complaints')
     * @param  string        $description Human-readable summary of the action
     * @param  array|null    $oldData     Previous state snapshot (for UPDATE / DELETE)
     * @param  array|null    $newData     New state snapshot    (for CREATE / UPDATE)
     * @param  int|null      $userId      Defaults to the currently authenticated user's ID
     * @return bool                        true on success, false if logging fails
     */
    public static function log(
        string $action,
        string $module,
        string $description,
        ?array $oldData = null,
        ?array $newData = null,
        ?int   $userId  = null,
    ): bool {
        try {
            $request = request();

            AuditLog::create([
                'user_id'     => $userId ?? Auth::id(),
                'action'      => strtoupper($action),
                'module'      => strtolower($module),
                'description' => $description,
                'old_data'    => $oldData,
                'new_data'    => $newData,
                'ip_address'  => $request?->ip(),
                'user_agent'  => $request?->userAgent(),
            ]);

            return true;
        } catch (Throwable $e) {
            // Never let audit logging break the main request flow
            Log::error('[AuditLog] Failed to record log entry', [
                'action'  => $action,
                'module'  => $module,
                'message' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Convenience wrapper — strips sensitive keys (password, token, etc.)
     * from a model's attribute array before storing as old/new data.
     */
    public static function sanitize(array $data): array
    {
        $sensitive = ['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes'];

        return array_diff_key($data, array_flip($sensitive));
    }
}
