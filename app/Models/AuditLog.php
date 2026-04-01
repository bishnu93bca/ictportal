<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    public const ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'];

    /** Disable updated_at — audit records are immutable. */
    public const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'action',
        'module',
        'description',
        'old_data',
        'new_data',
        'ip_address',
        'user_agent',
    ];

    protected function casts(): array
    {
        return [
            'old_data'   => 'array',
            'new_data'   => 'array',
            'created_at' => 'datetime',
        ];
    }

    /* ─── Relationships ─────────────────────────────────────────────── */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class)->withTrashed();
    }

    /* ─── Query Scopes ──────────────────────────────────────────────── */

    public function scopeForUser(Builder $q, int $userId): Builder
    {
        return $q->where('user_id', $userId);
    }

    public function scopeForModule(Builder $q, string $module): Builder
    {
        return $q->where('module', $module);
    }

    public function scopeForAction(Builder $q, string $action): Builder
    {
        return $q->where('action', strtoupper($action));
    }

    public function scopeBetween(Builder $q, string $from, string $to): Builder
    {
        return $q->whereBetween('created_at', [$from, $to]);
    }
}
