<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── Register ────────────────────────────────────────────────────────

    public function test_user_can_register_with_valid_data(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name'                  => 'Test User',
            'email'                 => 'test@example.com',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'taken@example.com']);

        $this->postJson('/api/v1/auth/register', [
            'name'                  => 'Another',
            'email'                 => 'taken@example.com',
            'password'              => 'Password1',
            'password_confirmation' => 'Password1',
        ])->assertStatus(422)->assertJsonValidationErrors(['email']);
    }

    public function test_register_fails_with_weak_password(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name'                  => 'User',
            'email'                 => 'user@example.com',
            'password'              => '123',
            'password_confirmation' => '123',
        ])->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    // ── Login ────────────────────────────────────────────────────────────

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create(['password' => bcrypt('Password1')]);

        $response = $this->postJson('/api/v1/auth/login', [
            'login'    => $user->email,
            'password' => 'Password1',
        ]);

        $response->assertOk()
                 ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('Password1')]);

        $this->postJson('/api/v1/auth/login', [
            'login'    => $user->email,
            'password' => 'WrongPass',
        ])->assertStatus(422)->assertJsonValidationErrors(['login']);
    }

    public function test_suspended_user_cannot_login(): void
    {
        $user = User::factory()->create([
            'password' => bcrypt('Password1'),
            'status'   => 'suspended',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'login'    => $user->email,
            'password' => 'Password1',
        ])->assertStatus(403);
    }

    // ── Logout ───────────────────────────────────────────────────────────

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->postJson('/api/v1/auth/logout')
             ->assertOk()
             ->assertJson(['message' => 'Logged out successfully.']);
    }

    // ── Me ───────────────────────────────────────────────────────────────

    public function test_me_returns_authenticated_user(): void
    {
        $user  = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)
             ->getJson('/api/v1/auth/me')
             ->assertOk()
             ->assertJsonPath('user.id', $user->id);
    }

    public function test_me_returns_401_when_unauthenticated(): void
    {
        $this->getJson('/api/v1/auth/me')->assertStatus(401);
    }
}
