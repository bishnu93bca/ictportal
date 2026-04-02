<?php

declare(strict_types=1);

namespace App\Http\Requests\EquipmentModel;

use Illuminate\Foundation\Http\FormRequest;

class StoreEquipmentModelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isSuperAdmin();
    }

    public function rules(): array
    {
        return [
            'sub_category_id' => ['required', 'integer', 'exists:sub_categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'boolean'],
        ];
    }
}
