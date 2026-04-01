<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsRole(string $role): array
    {
        $user  = User::factory()->create(['role' => $role, 'status' => 'active']);
        $token = $user->createToken('test')->plainTextToken;
        return [$user, $token];
    }

    // ── Index ─────────────────────────────────────────────────────────────

    public function test_admin_can_list_users(): void
    {
        [, $token] = $this->actingAsRole('admin');
        User::factory()->count(5)->create();

        $this->withToken($token)
             ->getJson('/api/v1/users')
             ->assertOk()
             ->assertJsonStructure(['data', 'total', 'current_page']);
    }

    public function test_student_cannot_list_users(): void
    {
        [, $token] = $this->actingAsRole('student');

        $this->withToken($token)
             ->getJson('/api/v1/users')
             ->assertStatus(403);
    }

    public function test_users_list_supports_search_filter(): void
    {
        [, $token] = $this->actingAsRole('admin');
        User::factory()->create(['name' => 'Alice Smith',  'email' => 'alice@example.com']);
        User::factory()->create(['name' => 'Bob Johnson',  'email' => 'bob@example.com']);

        $this->withToken($token)
             ->getJson('/api/v1/users?search=Alice')
             ->assertOk()
             ->assertJsonCount(1, 'data');
    }

    // ── Show ─────────────────────────────────────────────────────────────

    public function test_admin_can_view_any_user(): void
    {
        [, $token] = $this->actingAsRole('admin');
        $target = User::factory()->create();

        $this->withToken($token)
             ->getJson("/api/v1/users/{$target->id}")
             ->assertOk()
             ->assertJsonPath('user.id', $target->id);
    }

    public function test_user_can_view_own_profile(): void
    {
        [$user, $token] = $this->actingAsRole('student');

        $this->withToken($token)
             ->getJson("/api/v1/users/{$user->id}")
             ->assertOk();
    }

    public function test_student_cannot_view_other_users(): void
    {
        [, $token] = $this->actingAsRole('student');
        $other = User::factory()->create();

        $this->withToken($token)
             ->getJson("/api/v1/users/{$other->id}")
             ->assertStatus(403);
    }

    // ── Store ─────────────────────────────────────────────────────────────

    public function test_super_admin_can_create_user(): void
    {
        [, $token] = $this->actingAsRole('super_admin');

        $this->withToken($token)
             ->postJson('/api/v1/users', [
                 'name'                  => 'New Teacher',
                 'email'                 => 'teacher@school.com',
                 'password'              => 'Password1',
                 'password_confirmation' => 'Password1',
                 'role'                  => 'teacher',
             ])
             ->assertStatus(201);

        $this->assertDatabaseHas('users', ['email' => 'teacher@school.com']);
    }

    public function test_admin_cannot_create_user(): void
    {
        [, $token] = $this->actingAsRole('admin');

        $this->withToken($token)
             ->postJson('/api/v1/users', [
                 'name'                  => 'Should Fail',
                 'email'                 => 'nope@school.com',
                 'password'              => 'Password1',
                 'password_confirmation' => 'Password1',
                 'role'                  => 'teacher',
             ])
             ->assertStatus(403);
    }

    public function test_student_cannot_create_user(): void
    {
        [, $token] = $this->actingAsRole('student');

        $this->withToken($token)
             ->postJson('/api/v1/users', [
                 'name'                  => 'Hacker',
                 'email'                 => 'hacker@evil.com',
                 'password'              => 'Password1',
                 'password_confirmation' => 'Password1',
                 'role'                  => 'admin',
             ])
             ->assertStatus(403);
    }

    // ── Update ────────────────────────────────────────────────────────────

    public function test_admin_can_update_any_user(): void
    {
        [, $token] = $this->actingAsRole('admin');
        $target    = User::factory()->create(['name' => 'Old Name']);

        $this->withToken($token)
             ->putJson("/api/v1/users/{$target->id}", ['name' => 'New Name'])
             ->assertOk()
             ->assertJsonPath('user.name', 'New Name');
    }

    public function test_user_can_update_own_name(): void
    {
        [$user, $token] = $this->actingAsRole('teacher');

        $this->withToken($token)
             ->putJson("/api/v1/users/{$user->id}", ['name' => 'Updated Name'])
             ->assertOk();
    }

    public function test_admin_cannot_change_super_admin_password_via_users_api(): void
    {
        [, $token] = $this->actingAsRole('admin');
        $super     = User::factory()->create(['role' => 'super_admin']);

        $this->withToken($token)
             ->putJson("/api/v1/users/{$super->id}", [
                 'password'              => 'NewPassword1',
                 'password_confirmation' => 'NewPassword1',
             ])
             ->assertStatus(422)
             ->assertJsonValidationErrors(['password']);
    }

    public function test_non_admin_cannot_change_role(): void
    {
        [$user, $token] = $this->actingAsRole('teacher');

        $this->withToken($token)
             ->putJson("/api/v1/users/{$user->id}", ['role' => 'admin'])
             ->assertOk();

        // Role should remain unchanged
        $this->assertDatabaseHas('users', ['id' => $user->id, 'role' => 'teacher']);
    }

    // ── Destroy ───────────────────────────────────────────────────────────

    public function test_super_admin_can_delete_user(): void
    {
        [, $token] = $this->actingAsRole('super_admin');
        $target    = User::factory()->create();

        $this->withToken($token)
             ->deleteJson("/api/v1/users/{$target->id}")
             ->assertOk();

        $this->assertSoftDeleted('users', ['id' => $target->id]);
    }

    public function test_admin_cannot_delete_user(): void
    {
        [, $token] = $this->actingAsRole('admin');
        $target    = User::factory()->create();

        $this->withToken($token)
             ->deleteJson("/api/v1/users/{$target->id}")
             ->assertStatus(403);
    }

    // ── Profile ───────────────────────────────────────────────────────────

    public function test_user_can_get_own_profile(): void
    {
        [$user, $token] = $this->actingAsRole('teacher');

        $this->withToken($token)
             ->getJson('/api/v1/profile')
             ->assertOk()
             ->assertJsonPath('user.id', $user->id);
    }

    public function test_user_can_update_own_profile(): void
    {
        [, $token] = $this->actingAsRole('student');

        $this->withToken($token)
             ->putJson('/api/v1/profile', ['phone' => '9876543210'])
             ->assertOk()
             ->assertJsonPath('user.phone', '9876543210');
    }
}
