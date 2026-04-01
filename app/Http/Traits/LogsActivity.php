<?php

declare(strict_types=1);

namespace App\Http\Traits;

use App\Services\AuditLogService;

/**
 * Mixin for controllers — exposes short-hand audit helpers so controllers
 * don't need to import AuditLogService directly.
 *
 * Usage in a controller:
 *   use App\Http\Traits\LogsActivity;
 *
 *   $this->logCreate('users', 'Created user John Doe', $user->toArray());
 *   $this->logUpdate('complaints', 'Updated complaint #5', $before, $after);
 *   $this->logDelete('categories', 'Deleted category Hardware', $category->toArray());
 */
trait LogsActivity
{
    protected function logCreate(string $module, string $description, ?array $newData = null): bool
    {
        return AuditLogService::log('CREATE', $module, $description, null, $newData);
    }

    protected function logUpdate(
        string $module,
        string $description,
        ?array $oldData = null,
        ?array $newData = null,
    ): bool {
        return AuditLogService::log('UPDATE', $module, $description, $oldData, $newData);
    }

    protected function logDelete(string $module, string $description, ?array $oldData = null): bool
    {
        return AuditLogService::log('DELETE', $module, $description, $oldData, null);
    }

    protected function logAuth(string $action, string $description, ?int $userId = null): bool
    {
        return AuditLogService::log($action, 'auth', $description, null, null, $userId);
    }
}
