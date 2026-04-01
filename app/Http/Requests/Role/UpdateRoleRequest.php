<?php

declare(strict_types=1);

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isSuperAdmin();
    }

    public function rules(): array
    {
        $id = $this->route('role')?->id ?? $this->route('role');

        return [
            'name'        => ['sometimes', 'string', 'max:100'],
            'slug'        => ['sometimes', 'string', 'max:100', Rule::unique('roles', 'slug')->ignore($id)],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'is_system'   => ['sometimes', 'boolean'],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['integer', 'exists:permissions,id'],
        ];
    }
}
