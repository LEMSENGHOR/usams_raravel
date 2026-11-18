<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Department;
use App\Models\Faculty;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * WARNING: RefreshDatabase wipes the testing database.
 * phpunit.xml must use sqlite :memory: or a dedicated *_test database, never the real USAMS DB.
 */
class ReferenceDataTest extends TestCase
{
    use RefreshDatabase;

    private function actingAsRole(string $role): User
    {
        $user = User::factory()->create(['role' => $role, 'status' => 'ACTIVE']);
        Sanctum::actingAs($user);

        return $user;
    }

    public function test_admin_can_create_faculty(): void
    {
        $this->actingAsRole('ADMIN');

        $this->postJson('/api/faculties', ['code' => 'FST', 'name' => 'Faculty of Science'])
            ->assertCreated()
            ->assertJsonPath('data.code', 'FST');

        $this->assertDatabaseHas('faculties', ['code' => 'FST']);
    }

    public function test_lecturer_cannot_create_faculty(): void
    {
        $this->actingAsRole('LECTURER');

        $this->postJson('/api/faculties', ['code' => 'FST', 'name' => 'Faculty of Science'])
            ->assertForbidden();
    }

    public function test_student_can_list_faculties(): void
    {
        $this->actingAsRole('STUDENT');
        Faculty::create(['code' => 'FST', 'name' => 'Science']);

        $this->getJson('/api/faculties')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_guest_cannot_list_faculties(): void
    {
        $this->getJson('/api/faculties')->assertUnauthorized();
    }

    public function test_duplicate_faculty_code_returns_422(): void
    {
        $this->actingAsRole('ADMIN');
        Faculty::create(['code' => 'FST', 'name' => 'Science']);

        $this->postJson('/api/faculties', ['code' => 'FST', 'name' => 'Other'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('code');
    }

    public function test_partial_update_keeps_other_fields(): void
    {
        $this->actingAsRole('ADMIN');
        $faculty = Faculty::create(['code' => 'FST', 'name' => 'Science']);

        $this->patchJson("/api/faculties/{$faculty->id}", ['name' => 'Science and Tech'])
            ->assertOk()
            ->assertJsonPath('data.code', 'FST')
            ->assertJsonPath('data.name', 'Science and Tech');
    }

    public function test_cannot_delete_faculty_with_departments(): void
    {
        $this->actingAsRole('ADMIN');
        $faculty = Faculty::create(['code' => 'FST', 'name' => 'Science']);
        Department::create(['faculty_id' => $faculty->id, 'code' => 'CS', 'name' => 'Computer Science']);

        $this->deleteJson("/api/faculties/{$faculty->id}")->assertStatus(409);
        $this->assertDatabaseHas('faculties', ['id' => $faculty->id]);
    }

    public function test_can_delete_empty_faculty(): void
    {
        $this->actingAsRole('ADMIN');
        $faculty = Faculty::create(['code' => 'FST', 'name' => 'Science']);

        $this->deleteJson("/api/faculties/{$faculty->id}")->assertOk();
        $this->assertDatabaseMissing('faculties', ['id' => $faculty->id]);
    }

    public function test_department_requires_existing_faculty(): void
    {
        $this->actingAsRole('ADMIN');

        $this->postJson('/api/departments', ['faculty_id' => 9999, 'code' => 'CS', 'name' => 'CS'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('faculty_id');
    }

    public function test_pagination_and_search(): void
    {
        $this->actingAsRole('ADMIN');
        for ($i = 1; $i <= 12; $i++) {
            Faculty::create(['code' => "F{$i}", 'name' => "Faculty {$i}"]);
        }
        Faculty::create(['code' => 'ZED', 'name' => 'Unique Name']);

        $this->getJson('/api/faculties?per_page=5')
            ->assertOk()
            ->assertJsonCount(5, 'data')
            ->assertJsonPath('meta.per_page', 5)
            ->assertJsonPath('meta.total', 13);

        $this->getJson('/api/faculties?q=Unique')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_only_one_academic_year_can_be_current(): void
    {
        $this->actingAsRole('ADMIN');

        $first = $this->postJson('/api/academic-years', [
            'name' => '2025-2026', 'start_date' => '2025-09-01', 'end_date' => '2026-08-31', 'is_current' => true,
        ])->assertCreated()->json('data.id');

        $this->postJson('/api/academic-years', [
            'name' => '2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2027-08-31', 'is_current' => true,
        ])->assertCreated();

        $this->assertFalse(AcademicYear::find($first)->is_current);
        $this->assertSame(1, AcademicYear::where('is_current', true)->count());
    }

    public function test_academic_year_end_must_be_after_start(): void
    {
        $this->actingAsRole('ADMIN');

        $this->postJson('/api/academic-years', [
            'name' => '2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2026-01-01',
        ])->assertStatus(422)->assertJsonValidationErrors('end_date');
    }

    public function test_semester_must_be_within_academic_year(): void
    {
        $this->actingAsRole('ADMIN');
        $year = AcademicYear::create([
            'name' => '2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2027-08-31',
        ]);

        $this->postJson('/api/semesters', [
            'academic_year_id' => $year->id, 'name' => 'Semester 1',
            'start_date' => '2026-08-01', 'end_date' => '2026-12-31',
        ])->assertStatus(422)->assertJsonValidationErrors('start_date');

        $this->postJson('/api/semesters', [
            'academic_year_id' => $year->id, 'name' => 'Semester 1',
            'start_date' => '2026-09-01', 'end_date' => '2026-12-31',
        ])->assertCreated();
    }
}
