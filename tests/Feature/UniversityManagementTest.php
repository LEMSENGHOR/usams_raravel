<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\ClassSubject;
use App\Models\Department;
use App\Models\Enrollment;
use App\Models\Faculty;
use App\Models\Lecturer;
use App\Models\Major;
use App\Models\SchoolClass;
use App\Models\Semester;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * WARNING: RefreshDatabase wipes the testing database.
 * phpunit.xml must use sqlite :memory: or a dedicated *_test database, never the real USAMS DB.
 */
class UniversityManagementTest extends TestCase
{
    use RefreshDatabase;

    private Major $major;
    private Department $department;
    private AcademicYear $year;
    private Semester $semester;
    private SchoolClass $class;
    private Subject $subject;

    protected function setUp(): void
    {
        parent::setUp();

        $faculty = Faculty::create(['code' => 'FST', 'name' => 'Science']);
        $this->department = Department::create(['faculty_id' => $faculty->id, 'code' => 'CS', 'name' => 'Computer Science']);
        $this->major = Major::create(['department_id' => $this->department->id, 'code' => 'SE', 'name' => 'Software Engineering']);
        $this->year = AcademicYear::create(['name' => '2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2027-08-31']);
        $this->semester = Semester::create(['academic_year_id' => $this->year->id, 'name' => 'Semester 1', 'start_date' => '2026-09-01', 'end_date' => '2027-01-31']);
        $this->class = SchoolClass::create(['major_id' => $this->major->id, 'academic_year_id' => $this->year->id, 'code' => 'SE-Y1', 'name' => 'SE Year 1']);
        $this->subject = Subject::create(['department_id' => $this->department->id, 'code' => 'CS101', 'name' => 'Programming']);
    }

    private function userWithRole(string $role, string $email): User
    {
        return User::factory()->create(['role' => $role, 'status' => 'ACTIVE', 'email' => $email]);
    }

    private function makeStudent(string $email, string $code): Student
    {
        $user = $this->userWithRole('STUDENT', $email);

        return Student::create([
            'user_id' => $user->id, 'major_id' => $this->major->id,
            'student_code' => $code, 'full_name' => "Student {$code}",
        ]);
    }

    private function makeLecturer(string $email, string $code): Lecturer
    {
        $user = $this->userWithRole('LECTURER', $email);

        return Lecturer::create([
            'user_id' => $user->id, 'department_id' => $this->department->id,
            'lecturer_code' => $code, 'full_name' => "Lecturer {$code}",
        ]);
    }

    private function asAdmin(): void
    {
        Sanctum::actingAs($this->userWithRole('ADMIN', 'admin@example.com'));
    }

    public function test_admin_creates_student_with_hashed_password_and_forced_role(): void
    {
        $this->asAdmin();

        $response = $this->postJson('/api/students', [
            'major_id' => $this->major->id,
            'student_code' => 'S001',
            'full_name' => 'Sok Dara',
            'email' => 'dara@example.com',
            'password' => 'password123',
            'role' => 'SUPER_ADMIN', // must be ignored
        ])->assertCreated();

        $response->assertJsonPath('data.account.role', 'STUDENT')
            ->assertJsonMissingPath('data.account.password');

        $user = User::where('email', 'dara@example.com')->first();
        $this->assertSame('STUDENT', $user->role);
        $this->assertTrue(Hash::check('password123', $user->password));
        $this->assertDatabaseHas('students', ['student_code' => 'S001', 'user_id' => $user->id]);
    }

    public function test_student_creation_is_atomic_when_validation_fails(): void
    {
        $this->asAdmin();

        $this->postJson('/api/students', [
            'major_id' => 9999, 'student_code' => 'S001', 'full_name' => 'X',
            'email' => 'x@example.com', 'password' => 'password123',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('users', ['email' => 'x@example.com']);
    }

    public function test_non_admin_cannot_manage_or_list_students(): void
    {
        Sanctum::actingAs($this->userWithRole('LECTURER', 'lec@example.com'));

        $this->getJson('/api/students')->assertForbidden();
        $this->postJson('/api/students', [])->assertForbidden();
    }

    public function test_duplicate_enrollment_returns_409_and_year_is_derived(): void
    {
        $this->asAdmin();
        $student = $this->makeStudent('s1@example.com', 'S1');

        $this->postJson('/api/enrollments', ['student_id' => $student->id, 'class_id' => $this->class->id])
            ->assertCreated()
            ->assertJsonPath('data.academic_year_id', $this->year->id);

        $this->postJson('/api/enrollments', ['student_id' => $student->id, 'class_id' => $this->class->id])
            ->assertStatus(409);

        $this->assertSame(1, Enrollment::count());
    }

    public function test_student_sees_only_own_enrollments(): void
    {
        $s1 = $this->makeStudent('s1@example.com', 'S1');
        $s2 = $this->makeStudent('s2@example.com', 'S2');
        Enrollment::create(['student_id' => $s1->id, 'class_id' => $this->class->id, 'academic_year_id' => $this->year->id, 'status' => 'ACTIVE']);
        $other = Enrollment::create(['student_id' => $s2->id, 'class_id' => $this->class->id, 'academic_year_id' => $this->year->id, 'status' => 'ACTIVE']);

        Sanctum::actingAs($s1->user);

        $this->getJson('/api/enrollments')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/enrollments/{$other->id}")->assertForbidden();
    }

    public function test_lecturer_sees_only_own_class_subjects(): void
    {
        $lec1 = $this->makeLecturer('l1@example.com', 'L1');
        $lec2 = $this->makeLecturer('l2@example.com', 'L2');
        $subject2 = Subject::create(['department_id' => $this->department->id, 'code' => 'CS102', 'name' => 'Databases']);

        $mine = ClassSubject::create(['class_id' => $this->class->id, 'subject_id' => $this->subject->id, 'lecturer_id' => $lec1->id, 'semester_id' => $this->semester->id]);
        $theirs = ClassSubject::create(['class_id' => $this->class->id, 'subject_id' => $subject2->id, 'lecturer_id' => $lec2->id, 'semester_id' => $this->semester->id]);

        Sanctum::actingAs($lec1->user);

        $this->getJson('/api/class-subjects')->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
        $this->getJson("/api/class-subjects/{$theirs->id}")->assertForbidden();
    }

    public function test_class_subject_semester_must_match_class_year(): void
    {
        $this->asAdmin();
        $lecturer = $this->makeLecturer('l1@example.com', 'L1');
        $otherYear = AcademicYear::create(['name' => '2027-2028', 'start_date' => '2027-09-01', 'end_date' => '2028-08-31']);
        $otherSemester = Semester::create(['academic_year_id' => $otherYear->id, 'name' => 'Semester 1', 'start_date' => '2027-09-01', 'end_date' => '2028-01-31']);

        $this->postJson('/api/class-subjects', [
            'class_id' => $this->class->id, 'subject_id' => $this->subject->id,
            'lecturer_id' => $lecturer->id, 'semester_id' => $otherSemester->id,
        ])->assertStatus(422)->assertJsonValidationErrors('semester_id');
    }

    public function test_duplicate_class_subject_returns_409(): void
    {
        $this->asAdmin();
        $lecturer = $this->makeLecturer('l1@example.com', 'L1');
        $payload = [
            'class_id' => $this->class->id, 'subject_id' => $this->subject->id,
            'lecturer_id' => $lecturer->id, 'semester_id' => $this->semester->id,
        ];

        $this->postJson('/api/class-subjects', $payload)->assertCreated();
        $this->postJson('/api/class-subjects', $payload)->assertStatus(409);
    }

    public function test_timetable_conflict_for_same_lecturer_is_rejected(): void
    {
        $this->asAdmin();
        $lecturer = $this->makeLecturer('l1@example.com', 'L1');
        $subject2 = Subject::create(['department_id' => $this->department->id, 'code' => 'CS102', 'name' => 'Databases']);
        $class2 = SchoolClass::create(['major_id' => $this->major->id, 'academic_year_id' => $this->year->id, 'code' => 'SE-Y2', 'name' => 'SE Year 2']);

        $cs1 = ClassSubject::create(['class_id' => $this->class->id, 'subject_id' => $this->subject->id, 'lecturer_id' => $lecturer->id, 'semester_id' => $this->semester->id]);
        $cs2 = ClassSubject::create(['class_id' => $class2->id, 'subject_id' => $subject2->id, 'lecturer_id' => $lecturer->id, 'semester_id' => $this->semester->id]);

        $this->postJson('/api/timetables', [
            'class_subject_id' => $cs1->id, 'day_of_week' => 1, 'start_time' => '08:00', 'end_time' => '10:00',
        ])->assertCreated();

        // Same lecturer, overlapping time, different class
        $this->postJson('/api/timetables', [
            'class_subject_id' => $cs2->id, 'day_of_week' => 1, 'start_time' => '09:00', 'end_time' => '11:00',
        ])->assertStatus(422)->assertJsonValidationErrors('start_time');

        // Back-to-back is allowed
        $this->postJson('/api/timetables', [
            'class_subject_id' => $cs2->id, 'day_of_week' => 1, 'start_time' => '10:00', 'end_time' => '12:00',
        ])->assertCreated();
    }

    public function test_cannot_delete_student_with_enrollment(): void
    {
        $this->asAdmin();
        $student = $this->makeStudent('s1@example.com', 'S1');
        Enrollment::create(['student_id' => $student->id, 'class_id' => $this->class->id, 'academic_year_id' => $this->year->id, 'status' => 'ACTIVE']);

        $this->deleteJson("/api/students/{$student->id}")->assertStatus(409);
        $this->assertDatabaseHas('students', ['id' => $student->id]);
    }

    public function test_can_deactivate_student_via_status(): void
    {
        $this->asAdmin();
        $student = $this->makeStudent('s1@example.com', 'S1');

        $this->patchJson("/api/students/{$student->id}", ['status' => 'INACTIVE'])
            ->assertOk()
            ->assertJsonPath('data.account.status', 'INACTIVE');
    }

    public function test_cannot_delete_class_with_enrollments(): void
    {
        $this->asAdmin();
        $student = $this->makeStudent('s1@example.com', 'S1');
        Enrollment::create(['student_id' => $student->id, 'class_id' => $this->class->id, 'academic_year_id' => $this->year->id, 'status' => 'ACTIVE']);

        $this->deleteJson("/api/classes/{$this->class->id}")->assertStatus(409);
    }
}
