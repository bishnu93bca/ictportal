<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'role'     => ['required', 'string', 'in:' . implode(',', User::ROLES)],
            'status'   => ['sometimes', 'string', 'in:' . implode(',', User::STATUSES)],
            'phone'    => ['nullable', 'string', 'max:10'],
            'gender'   => ['nullable', 'string', 'in:male,female,other'],
        ];
    }
}
