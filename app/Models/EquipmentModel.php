<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EquipmentModel extends Model
{
    use HasFactory;

    protected $fillable = ['sub_category_id', 'name', 'slug', 'status'];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function subCategory(): BelongsTo
    {
        return $this->belongsTo(SubCategory::class);
    }

    public function complaints(): HasMany
    {
        return $this->hasMany(Complaint::class, 'equipment_model_id');
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
