<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * WARNING: RefreshDatabase wipes the database configured for testing.
 * Make sure phpunit.xml uses sqlite :memory: or a dedicated *_test database,
 * NEVER your real USAMS database.
 */
class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role = 'LECTURER', string $status = 'ACTIVE'): User
    {
        return User::factory()->create([
            'email' => strtolower($role) . '@example.com',
            'password' => 'secret123',
            'role' => $role,
            'status' => $status,
        ]);
    }

    public function test_login_succeeds_and_hides_sensitive_fields(): void
    {
        $this->makeUser();

        $response = $this->postJson('/api/auth/login', [
            'email' => 'lecturer@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'token_type', 'user' => ['id', 'email', 'role', 'status']]])
            ->assertJsonMissingPath('data.user.password');
    }

    public function test_login_with_wrong_password_returns_401(): void
    {
        $this->makeUser();

        $this->postJson('/api/auth/login', [
            'email' => 'lecturer@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(401);
    }

    public function test_login_validation_returns_422(): void
    {
        $this->postJson('/api/auth/login', [])->assertStatus(422);
    }

    public function test_inactive_user_cannot_login(): void
    {
        $this->makeUser('LECTURER', 'INACTIVE');

        $this->postJson('/api/auth/login', [
            'email' => 'lecturer@example.com',
            'password' => 'secret123',
        ])->assertStatus(403);
    }

    public function test_me_requires_token(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }

    public function test_me_returns_authenticated_user(): void
    {
        $token = $this->makeUser()->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/auth/me')
            ->assertOk()
            ->assertJsonPath('data.email', 'lecturer@example.com');
    }

    public function test_logout_revokes_token(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/auth/logout')->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_deactivated_user_with_old_token_is_blocked(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('test')->plainTextToken;
        $user->forceFill(['status' => 'SUSPENDED'])->save();

        $this->withToken($token)->getJson('/api/auth/me')->assertStatus(403);
    }

    public function test_lecturer_cannot_access_admin_route(): void
    {
        $token = $this->makeUser('LECTURER')->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/admin/ping')->assertStatus(403);
    }

    public function test_admin_can_access_admin_route(): void
    {
        $token = $this->makeUser('ADMIN')->createToken('test')->plainTextToken;

        $this->withToken($token)->getJson('/api/admin/ping')
            ->assertOk()
            ->assertJsonPath('message', 'pong');
    }
}
