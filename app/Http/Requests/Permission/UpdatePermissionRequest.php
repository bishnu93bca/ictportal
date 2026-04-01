<?php

declare(strict_types=1);

namespace App\Http\Requests\Permission;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isSuperAdmin();
    }

    public function rules(): array
    {
        $id = $this->route('permission')?->id ?? $this->route('permission');

        return [
            'name'        => ['sometimes', 'string', 'max:150'],
            'slug'        => ['sometimes', 'string', 'max:100', Rule::unique('permissions', 'slug')->ignore($id), 'regex:/^[a-z0-9\.\-_]+$/'],
            'description' => ['sometimes', 'nullable', 'string', 'max:500'],
            'group'       => ['sometimes', 'string', 'max:50'],
        ];
    }
}
