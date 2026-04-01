<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Complaint extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUSES = ['pending', 'under_review', 'resolved', 'rejected'];

    protected $fillable = [
        'user_id',
        'complainant_name',
        'school_name',
        'udise_code',
        'category_id',
        'sub_category_id',
        'title',
        'description',
        'status',
        'admin_note',
        'resolved_by',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(SubCategory::class, 'sub_category_id');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ComplaintAttachment::class);
    }

    /**
     * Limit complaints to those filed by users in the same district as this admin.
     * Super admins and admins without a district are not restricted.
     */
    public function scopeForDistrictAdmin(Builder $query, User $admin): Builder
    {
        if (! $admin->isDistrictScopedAdmin()) {
            return $query;
        }

        return $query->whereHas('user', function (Builder $q) use ($admin): void {
            $q->whereRaw('LOWER(TRIM(COALESCE(users.district, ""))) = ?', [
                mb_strtolower(trim((string) $admin->district)),
            ]);
        });
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isResolved(): bool
    {
        return $this->status === 'resolved';
    }
}
