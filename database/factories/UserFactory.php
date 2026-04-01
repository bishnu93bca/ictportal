<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name'               => fake()->name(),
            'email'              => fake()->unique()->safeEmail(),
            'email_verified_at'  => now(),
            'password'           => static::$password ??= Hash::make('password'),
            'remember_token'     => Str::random(10),
            'role'               => fake()->randomElement(User::ROLES),
            'status'             => 'active',
            'phone'              => fake()->numerify('##########'),
            'gender'             => fake()->randomElement(['male', 'female', 'other']),
            'city'               => fake()->city(),
            'state'              => fake()->state(),
            'country'            => 'India',
        ];
    }

    public function unverified(): static
    {
        return $this->state(fn () => ['email_verified_at' => null]);
    }

    public function admin(): static
    {
        return $this->state(fn () => ['role' => 'admin', 'status' => 'active']);
    }

    public function superAdmin(): static
    {
        return $this->state(fn () => ['role' => 'super_admin', 'status' => 'active']);
    }

    public function student(): static
    {
        return $this->state(fn () => ['role' => 'student', 'status' => 'active']);
    }

    public function teacher(): static
    {
        return $this->state(fn () => ['role' => 'teacher', 'status' => 'active']);
    }

    public function suspended(): static
    {
        return $this->state(fn () => ['status' => 'suspended']);
    }
}
