<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
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
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * WARNING: RefreshDatabase wipes the testing database.
 * phpunit.xml must use sqlite :memory: or a dedicated *_test database, never the real USAMS DB.
 *
 * Fixture (records written directly, so these tests do not depend on the attendance endpoints):
 *   session 1  cs1  2026-10-05  CLOSED  s1 PRESENT  s2 ABSENT
 *   session 2  cs1  2026-10-12  CLOSED  s1 LATE     s2 EXCUSED
 *   session 3  cs2  2026-10-13  OPEN    s1 PRESENT  s2 PENDING
 *
 * Overall: present 2, absent 1, late 1, excused 1, pending 1, total 6
 *   percentage = (2 + 1) / (2 + 1 + 1) = 75.00
 */
class AttendanceReportTest extends TestCase
{
    use RefreshDatabase;

    private Department $department;
    private Lecturer $lecturer1;
    private Lecturer $lecturer2;
    private Student $s1;
    private Student $s2;

    protected function setUp(): void
    {
        parent::setUp();

        $faculty = Faculty::create(['code' => 'FST', 'name' => 'Science']);
        $this->department = Department::create(['faculty_id' => $faculty->id, 'code' => 'CS', 'name' => 'Computer Science']);
        $major = Major::create(['department_id' => $this->department->id, 'code' => 'SE', 'name' => 'Software Engineering']);
        $year = AcademicYear::create(['name' => '2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2027-08-31']);
        $semester = Semester::create(['academic_year_id' => $year->id, 'name' => 'Semester 1', 'start_date' => '2026-09-01', 'end_date' => '2027-01-31']);
        $class = SchoolClass::create(['major_id' => $major->id, 'academic_year_id' => $year->id, 'code' => 'SE-Y1', 'name' => 'SE Year 1']);

        $subject1 = Subject::create(['department_id' => $this->department->id, 'code' => 'CS101', 'name' => 'Programming']);
        $subject2 = Subject::create(['department_id' => $this->department->id, 'code' => 'CS102', 'name' => 'Databases']);

        $this->lecturer1 = $this->makeLecturer('l1@example.com', 'L1');
        $this->lecturer2 = $this->makeLecturer('l2@example.com', 'L2');

        $cs1 = ClassSubject::create(['class_id' => $class->id, 'subject_id' => $subject1->id, 'lecturer_id' => $this->lecturer1->id, 'semester_id' => $semester->id]);
        $cs2 = ClassSubject::create(['class_id' => $class->id, 'subject_id' => $subject2->id, 'lecturer_id' => $this->lecturer2->id, 'semester_id' => $semester->id]);

        $this->s1 = $this->makeStudent('s1@example.com', 'S1', $major, $class, $year);
        $this->s2 = $this->makeStudent('s2@example.com', 'S2', $major, $class, $year);

        $session1 = $this->makeSession($cs1, '2026-10-05', 'CLOSED');
        $session2 = $this->makeSession($cs1, '2026-10-12', 'CLOSED');
        $session3 = $this->makeSession($cs2, '2026-10-13', 'OPEN');

        $this->makeRecord($session1, $this->s1, 'PRESENT');
        $this->makeRecord($session1, $this->s2, 'ABSENT');
        $this->makeRecord($session2, $this->s1, 'LATE');
        $this->makeRecord($session2, $this->s2, 'EXCUSED');
        $this->makeRecord($session3, $this->s1, 'PRESENT');
        $this->makeRecord($session3, $this->s2, 'PENDING');
    }

    // ---------------------------------------------------------------- helpers

    private function makeUser(string $role, string $email): User
    {
        return User::factory()->create(['role' => $role, 'status' => 'ACTIVE', 'email' => $email]);
    }

    private function makeLecturer(string $email, string $code): Lecturer
    {
        return Lecturer::create([
            'user_id' => $this->makeUser('LECTURER', $email)->id,
            'department_id' => $this->department->id,
            'lecturer_code' => $code,
            'full_name' => "Lecturer {$code}",
        ]);
    }

    private function makeStudent(string $email, string $code, Major $major, SchoolClass $class, AcademicYear $year): Student
    {
        $student = Student::create([
            'user_id' => $this->makeUser('STUDENT', $email)->id,
            'major_id' => $major->id,
            'student_code' => $code,
            'full_name' => "Student {$code}",
        ]);

        Enrollment::create(['student_id' => $student->id, 'class_id' => $class->id, 'academic_year_id' => $year->id, 'status' => 'ACTIVE']);

        return $student;
    }

    private function makeSession(ClassSubject $cs, string $date, string $status): AttendanceSession
    {
        $session = new AttendanceSession([
            'class_subject_id' => $cs->id,
            'session_date' => $date,
            'start_time' => '08:00:00',
            'end_time' => '10:00:00',
        ]);
        $session->forceFill(['status' => $status, 'created_by' => $this->lecturer1->user_id])->save();

        return $session;
    }

    private function makeRecord(AttendanceSession $session, Student $student, string $status): void
    {
        $record = new AttendanceRecord(['attendance_session_id' => $session->id, 'student_id' => $student->id]);
        $record->forceFill(['status' => $status])->save();
    }

    private function asAdmin(): void
    {
        Sanctum::actingAs($this->makeUser('ADMIN', 'admin@example.com'));
    }

    private function row(array $rows, string $code): array
    {
        $found = collect($rows)->firstWhere('code', $code);
        $this->assertNotNull($found, "Row {$code} not found in report");

        return $found;
    }

    // ------------------------------------------------------------- formula

    public function test_totals_and_percentage_follow_the_documented_formula(): void
    {
        $this->asAdmin();

        $response = $this->getJson('/api/attendance-reports?group_by=class')->assertOk();

        $response->assertJsonPath('totals.present', 2)
            ->assertJsonPath('totals.absent', 1)
            ->assertJsonPath('totals.late', 1)
            ->assertJsonPath('totals.excused', 1)
            ->assertJsonPath('totals.pending', 1)
            ->assertJsonPath('totals.total', 6)
            ->assertJsonCount(1, 'data');

        // EXCUSED and PENDING are excluded from the denominator: (2 + 1) / (2 + 1 + 1) = 75.
        $this->assertEqualsWithDelta(75.0, $response->json('totals.attendance_percentage'), 0.001);
        $this->assertEqualsWithDelta(75.0, $response->json('data.0.attendance_percentage'), 0.001);
    }

    public function test_group_by_student(): void
    {
        $this->asAdmin();

        $rows = $this->getJson('/api/attendance-reports?group_by=student')->assertOk()->json('data');

        $s1 = $this->row($rows, 'S1'); // present 2, late 1 -> 100%
        $this->assertSame(2, $s1['present']);
        $this->assertSame(1, $s1['late']);
        $this->assertEqualsWithDelta(100.0, $s1['attendance_percentage'], 0.001);

        $s2 = $this->row($rows, 'S2'); // absent 1, excused 1, pending 1 -> denominator 1, attended 0 -> 0%
        $this->assertSame(1, $s2['absent']);
        $this->assertSame(1, $s2['excused']);
        $this->assertSame(1, $s2['pending']);
        $this->assertEqualsWithDelta(0.0, $s2['attendance_percentage'], 0.001);
    }

    public function test_group_by_subject(): void
    {
        $this->asAdmin();

        $rows = $this->getJson('/api/attendance-reports?group_by=subject')->assertOk()->json('data');

        $cs101 = $this->row($rows, 'CS101'); // present 1, absent 1, late 1, excused 1 -> 2/3
        $this->assertSame(4, $cs101['total']);
        $this->assertEqualsWithDelta(66.67, $cs101['attendance_percentage'], 0.001);

        $cs102 = $this->row($rows, 'CS102'); // present 1, pending 1 -> 100%
        $this->assertSame(1, $cs102['pending']);
        $this->assertEqualsWithDelta(100.0, $cs102['attendance_percentage'], 0.001);
    }

    public function test_group_by_date_lecturer_and_semester(): void
    {
        $this->asAdmin();

        $this->getJson('/api/attendance-reports?group_by=date')->assertOk()->assertJsonCount(3, 'data');
        $this->getJson('/api/attendance-reports?group_by=lecturer')->assertOk()->assertJsonCount(2, 'data');
        $this->getJson('/api/attendance-reports?group_by=semester')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.total', 6);
    }

    public function test_percentage_is_null_when_denominator_is_zero(): void
    {
        $this->asAdmin();

        // Only session 3: S2 has just a PENDING record, so nothing has been decided yet.
        $rows = $this->getJson('/api/attendance-reports?group_by=student&date_from=2026-10-13')
            ->assertOk()->json('data');

        $this->assertNull($this->row($rows, 'S2')['attendance_percentage']);
        $this->assertSame(1, $this->row($rows, 'S2')['pending']);
    }

    // ------------------------------------------------------------- filters

    public function test_date_filters(): void
    {
        $this->asAdmin();

        $this->getJson('/api/attendance-reports?group_by=date&date_from=2026-10-12')
            ->assertOk()->assertJsonCount(2, 'data')->assertJsonPath('totals.total', 4);

        $this->getJson('/api/attendance-reports?group_by=date&date_to=2026-10-05')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('totals.total', 2);

        $this->getJson('/api/attendance-reports?group_by=date&date_from=2026-10-12&date_to=2026-10-05')
            ->assertStatus(422)->assertJsonValidationErrors('date_to');
    }

    public function test_student_filter_and_pagination(): void
    {
        $this->asAdmin();

        $this->getJson("/api/attendance-reports?group_by=student&student_id={$this->s1->id}")
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('totals.total', 3);

        $this->getJson('/api/attendance-reports?group_by=student&per_page=1')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.total', 2)
            ->assertJsonPath('meta.last_page', 2)
            ->assertJsonPath('meta.per_page', 1);
    }

    public function test_invalid_group_by_returns_422(): void
    {
        $this->asAdmin();

        $this->getJson('/api/attendance-reports')->assertStatus(422)->assertJsonValidationErrors('group_by');
        $this->getJson('/api/attendance-reports?group_by=password')->assertStatus(422)->assertJsonValidationErrors('group_by');
    }

    // ------------------------------------------------------- permissions

    public function test_lecturer_sees_only_own_class_subjects(): void
    {
        Sanctum::actingAs($this->lecturer1->user);

        $this->getJson('/api/attendance-reports?group_by=class')
            ->assertOk()
            ->assertJsonPath('totals.total', 4); // session 3 belongs to lecturer2

        $rows = $this->getJson('/api/attendance-reports?group_by=lecturer')->assertOk()->json('data');
        $this->assertCount(1, $rows);
        $this->assertSame('L1', $rows[0]['code']);

        Sanctum::actingAs($this->lecturer2->user);
        $this->getJson('/api/attendance-reports?group_by=class')->assertOk()->assertJsonPath('totals.total', 2);
    }

    public function test_lecturer_cannot_widen_scope_with_filters(): void
    {
        Sanctum::actingAs($this->lecturer1->user);

        // Asking for the other lecturer's data returns nothing, not their data.
        $this->getJson("/api/attendance-reports?group_by=student&lecturer_id={$this->lecturer2->id}")
            ->assertOk()
            ->assertJsonCount(0, 'data')
            ->assertJsonPath('totals.total', 0);
    }

    public function test_student_cannot_use_reports(): void
    {
        Sanctum::actingAs($this->s1->user);

        $this->getJson('/api/attendance-reports?group_by=class')->assertForbidden();
        $this->getJson('/api/attendance-reports/export?group_by=class')->assertForbidden();
    }

    public function test_guest_cannot_use_reports(): void
    {
        $this->getJson('/api/attendance-reports?group_by=class')->assertUnauthorized();
    }

    // ----------------------------------------------------------------- CSV

    public function test_csv_export_has_header_rows_and_utf8_bom(): void
    {
        $this->asAdmin();

        $response = $this->get('/api/attendance-reports/export?group_by=student');
        $response->assertOk();

        $this->assertStringStartsWith('text/csv', $response->headers->get('Content-Type'));

        $csv = $response->streamedContent();
        $this->assertStringStartsWith("\xEF\xBB\xBF", $csv);
        $this->assertStringContainsString('attendance_percentage', $csv);
        $this->assertStringContainsString('S1', $csv);
        $this->assertStringContainsString('S2', $csv);
    }

    public function test_csv_export_neutralises_formula_injection(): void
    {
        $this->s1->update(['full_name' => '=HYPERLINK("http://evil.example")']);
        $this->asAdmin();

        $csv = $this->get('/api/attendance-reports/export?group_by=student')->streamedContent();

        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringNotContainsString(',"=HYPERLINK', $csv);
    }

    public function test_csv_export_respects_lecturer_scope(): void
    {
        Sanctum::actingAs($this->lecturer2->user);

        $csv = $this->get('/api/attendance-reports/export?group_by=subject')->streamedContent();

        $this->assertStringContainsString('CS102', $csv);
        $this->assertStringNotContainsString('CS101', $csv);
    }
}
