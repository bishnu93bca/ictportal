<?php

declare(strict_types=1);

namespace App\Http\Requests\Complaint;

use Illuminate\Foundation\Http\FormRequest;

class StoreComplaintRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'complainant_name' => ['required', 'string', 'max:255'],
            'school_name'      => ['required', 'string', 'max:255'],
            'udise_code'       => ['required', 'string', 'max:50'],
            'category_id'      => ['required', 'integer', 'exists:categories,id'],
            'sub_category_id'  => ['nullable', 'integer', 'exists:sub_categories,id'],
            'title'            => ['required', 'string', 'max:255'],
            'description'      => ['required', 'string', 'max:5000'],
            'attachments'      => ['nullable', 'array', 'max:5'],
            'attachments.*'    => [
                'file',
                'max:10240',
                'mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,txt,zip',
            ],
        ];
    }
}
