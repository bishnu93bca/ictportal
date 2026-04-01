<?php

declare(strict_types=1);

namespace App\Http\Requests\Permission;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isSuperAdmin();
    }

    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:150'],
            'slug'        => ['required', 'string', 'max:100', 'unique:permissions,slug', 'regex:/^[a-z0-9\.\-_]+$/'],
            'description' => ['nullable', 'string', 'max:500'],
            'group'       => ['required', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.regex' => 'Slug may only contain lowercase letters, numbers, dots, dashes and underscores.',
        ];
    }
}
