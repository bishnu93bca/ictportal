<?php

declare(strict_types=1);

namespace App\Http\Requests\User;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User $target */
        $target = $this->route('user');

        return $this->user()->can('update', $target);
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            /** @var User|null $target */
            $target = $this->route('user');

            if (! $target || ! $this->filled('password')) {
                return;
            }

            // Super admin password may only be changed by that user (self), not by another admin.
            if ($target->isSuperAdmin() && $this->user()->id !== $target->id) {
                $validator->errors()->add(
                    'password',
                    'The super administrator password can only be changed by the account owner.',
                );
            }
        });
    }

    public function rules(): array
    {
        $userId = $this->route('user')?->id;

        return [
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['sometimes', 'confirmed', Password::min(8)->letters()->numbers()],
            'role'     => ['sometimes', 'string', 'in:' . implode(',', User::ROLES)],
            'status'   => ['sometimes', 'string', 'in:' . implode(',', User::STATUSES)],
            'phone'    => ['nullable', 'string', 'max:10'],
            'gender'   => ['nullable', 'string', 'in:male,female,other'],
            'avatar'   => ['nullable', 'string', 'max:500'],
            'address'  => ['nullable', 'string'],
            'city'     => ['nullable', 'string', 'max:100'],
            'state'    => ['nullable', 'string', 'max:100'],
            'country'  => ['nullable', 'string', 'max:100'],
            'postal_code'       => ['nullable', 'string', 'max:20'],
            'date_of_birth'     => ['nullable', 'date', 'before:today'],
            'school_name'       => ['nullable', 'string'],
            'udise_code'        => ['nullable', 'string'],
            'email_notifications' => ['sometimes', 'boolean'],
            'sms_notifications'   => ['sometimes', 'boolean'],
            'push_notifications'  => ['sometimes', 'boolean'],
        ];
    }
}
