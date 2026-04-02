<?php

declare(strict_types=1);

namespace App\Http\Requests\EquipmentModel;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEquipmentModelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isSuperAdmin();
    }

    public function rules(): array
    {
        return [
            'sub_category_id' => ['sometimes', 'integer', 'exists:sub_categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'boolean'],
        ];
    }
}
