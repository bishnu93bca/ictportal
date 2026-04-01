<?php

declare(strict_types=1);

namespace App\Http\Requests\Complaint;

use Illuminate\Foundation\Http\FormRequest;

class UpdateComplaintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category_id'     => ['sometimes', 'integer', 'exists:categories,id'],
            'sub_category_id' => ['sometimes', 'nullable', 'integer', 'exists:sub_categories,id'],
            'title'           => ['sometimes', 'string', 'max:255'],
            'description'     => ['sometimes', 'string', 'max:5000'],
        ];
    }
}
