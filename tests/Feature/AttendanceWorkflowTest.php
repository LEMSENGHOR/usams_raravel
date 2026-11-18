<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\AttendanceAuditLog;
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
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use LogicException;
use Tests\TestCase;

/**
 * WARNING: RefreshDatabase wipes the testing database.
 * phpunit.xml must use sqlite :memory: or a dedicated *_test database, never the real USAMS DB.
 */
class AttendanceWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private const DATE = '2026-10-05'; // inside the semester below

    private Department $department;
    private Major $major;
    private AcademicYear $year;
    private Semester $semester;
    private SchoolClass $class;
    private Lecturer $lecturer1;
    private Lecturer $lecturer2;
    private ClassSubject $cs1; // taught by lecturer1
    private ClassSubject $cs2; // taught by lecturer2
    private Student $s1;
    private Student $s2;
    private Student $s3; // DROPPED: must never receive a record

    protected function setUp(): void
    {
        parent::setUp();

        $faculty = Faculty::create(['code' => 'FST', 'name' => 'Science']);
        $this->department = Department::create(['faculty_id' => $faculty->id, 'code' => 'CS', 'name' => 'Computer Science']);
        $this->major = Major::create(['department_id' => $this->department->id, 'code' => 'SE', 'name' => 'Software Engineering']);
        $this->year = AcademicYear::create(['name' => '2026-2027', 'start_date' => '2026-09-01', 'end_date' => '2027-08-31']);
        $this->semester = Semester::create(['academic_year_id' => $this->year->id, 'name' => 'Semester 1', 'start_date' => '2026-09-01', 'end_date' => '2027-01-31']);
        $this->class = SchoolClass::create(['major_id' => $this->major->id, 'academic_year_id' => $this->year->id, 'code' => 'SE-Y1', 'name' => 'SE Year 1']);

        $subject1 = Subject::create(['department_id' => $this->department->id, 'code' => 'CS101', 'name' => 'Programming']);
        $subject2 = Subject::create(['department_id' => $this->department->id, 'code' => 'CS102', 'name' => 'Databases']);

        $this->lecturer1 = $this->makeLecturer('l1@example.com', 'L1');
        $this->lecturer2 = $this->makeLecturer('l2@example.com', 'L2');

        $this->cs1 = ClassSubject::create(['class_id' => $this->class->id, 'subject_id' => $subject1->id, 'lecturer_id' => $this->lecturer1->id, 'semester_id' => $this->semester->id]);
        $this->cs2 = ClassSubject::create(['class_id' => $this->class->id, 'subject_id' => $subject2->id, 'lecturer_id' => $this->lecturer2->id, 'semester_id' => $this->semester->id]);

        $this->s1 = $this->makeStudent('s1@example.com', 'S1', Enrollment::STATUS_ACTIVE);
        $this->s2 = $this->makeStudent('s2@example.com', 'S2', Enrollment::STATUS_ACTIVE);
        $this->s3 = $this->makeStudent('s3@example.com', 'S3', Enrollment::STATUS_DROPPED);
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

    private function makeStudent(string $email, string $code, string $enrollmentStatus): Student
    {
        $student = Student::create([
            'user_id' => $this->makeUser('STUDENT', $email)->id,
            'major_id' => $this->major->id,
            'student_code' => $code,
            'full_name' => "Student {$code}",
        ]);

        Enrollment::create([
            'student_id' => $student->id,
            'class_id' => $this->class->id,
            'academic_year_id' => $this->year->id,
            'status' => $enrollmentStatus,
        ]);

        return $student;
    }

    private function makeSession(ClassSubject $cs, string $status = 'SCHEDULED', string $date = self::DATE): AttendanceSession
    {
        $session = new AttendanceSession([
            'class_subject_id' => $cs->id,
            'session_date' => $date,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ]);
        $session->forceFill(['status' => $status, 'created_by' => $this->lecturer1->user_id])->save();

        return $session;
    }

    /** Create a SCHEDULED session for cs1 and open it through the API (roster is created). */
    private function openedSession(string $date = self::DATE): AttendanceSession
    {
        $session = $this->makeSession($this->cs1, 'SCHEDULED', $date);
        Sanctum::actingAs($this->lecturer1->user);
        $this->postJson("/api/attendance-sessions/{$session->id}/open")->assertOk();

        return $session->refresh();
    }

    private function recordFor(AttendanceSession $session, Student $student): AttendanceRecord
    {
        return AttendanceRecord::where('attendance_session_id', $session->id)
            ->where('student_id', $student->id)
            ->firstOrFail();
    }

    private function markUrl(AttendanceSession $session, AttendanceRecord $record): string
    {
        return "/api/attendance-sessions/{$session->id}/records/{$record->id}";
    }

    // ------------------------------------------------------- session creation

    public function test_lecturer_creates_session_for_own_class_subject(): void
    {
        Sanctum::actingAs($this->lecturer1->user);

        $this->postJson('/api/attendance-sessions', [
            'class_subject_id' => $this->cs1->id,
            'session_date' => self::DATE,
            'start_time' => '08:00',
            'end_time' => '10:00',
            'status' => 'CLOSED',            // must be ignored
            'created_by' => 999,             // must be ignored
        ])->assertCreated()
            ->assertJsonPath('data.status', 'SCHEDULED')
            ->assertJsonPath('data.created_by', $this->lecturer1->user_id);
    }

    public function test_lecturer_cannot_create_session_for_another_lecturers_class_subject(): void
    {
        Sanctum::actingAs($this->lecturer1->user);

        $this->postJson('/api/attendance-sessions', [
            'class_subject_id' => $this->cs2->id,
            'session_date' => self::DATE,
            'start_time' => '08:00',
            'end_time' => '10:00',
        ])->assertForbidden();

        $this->assertDatabaseCount('attendance_sessions', 0);
    }

    public function test_duplicate_session_returns_409(): void
    {
        Sanctum::actingAs($this->lecturer1->user);
        $payload = ['class_subject_id' => $this->cs1->id, 'session_date' => self::DATE, 'start_time' => '08:00', 'end_time' => '10:00'];

        $this->postJson('/api/attendance-sessions', $payload)->assertCreated();
        $this->postJson('/api/attendance-sessions', $payload)->assertStatus(409);
    }

    public function test_session_date_outside_semester_returns_422(): void
    {
        Sanctum::actingAs($this->lecturer1->user);

        $this->postJson('/api/attendance-sessions', [
            'class_subject_id' => $this->cs1->id,
            'session_date' => '2027-06-01',
            'start_time' => '08:00',
            'end_time' => '10:00',
        ])->assertStatus(422)->assertJsonValidationErrors('session_date');
    }

    public function test_end_time_must_be_after_start_time(): void
    {
        Sanctum::actingAs($this->lecturer1->user);

        $this->postJson('/api/attendance-sessions', [
            'class_subject_id' => $this->cs1->id,
            'session_date' => self::DATE,
            'start_time' => '10:00',
            'end_time' => '08:00',
        ])->assertStatus(422)->assertJsonValidationErrors('end_time');
    }

    public function test_student_cannot_use_session_endpoints(): void
    {
        Sanctum::actingAs($this->s1->user);

        $this->getJson('/api/attendance-sessions')->assertForbidden();
        $this->postJson('/api/attendance-sessions', [])->assertForbidden();
    }

    // -------------------------------------------------------------- visibility

    public function test_lecturer_sees_only_own_sessions_and_admin_sees_all(): void
    {
        $mine = $this->makeSession($this->cs1);
        $theirs = $this->makeSession($this->cs2);

        Sanctum::actingAs($this->lecturer1->user);
        $this->getJson('/api/attendance-sessions')->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $mine->id);
        $this->getJson("/api/attendance-sessions/{$theirs->id}")->assertForbidden();

        Sanctum::actingAs($this->makeUser('ADMIN', 'admin@example.com'));
        $this->getJson('/api/attendance-sessions')->assertOk()->assertJsonCount(2, 'data');
    }

    // ------------------------------------------------------- open + roster

    public function test_open_creates_pending_records_only_for_active_enrollments(): void
    {
        $session = $this->makeSession($this->cs1);
        Sanctum::actingAs($this->lecturer1->user);

        $this->postJson("/api/attendance-sessions/{$session->id}/open")
            ->assertOk()
            ->assertJsonPath('data.status', 'OPEN')
            ->assertJsonPath('records_created', 2)
            ->assertJsonPath('data.summary.pending', 2);

        $this->assertSame(2, AttendanceRecord::count());
        $this->assertSame(2, AttendanceRecord::where('status', 'PENDING')->count());
        $this->assertDatabaseMissing('attendance_records', ['student_id' => $this->s3->id]);
    }

    public function test_opening_twice_returns_409(): void
    {
        $session = $this->openedSession();

        $this->postJson("/api/attendance-sessions/{$session->id}/open")->assertStatus(409);
        $this->assertSame(2, AttendanceRecord::count());
    }

    public function test_initialize_is_idempotent_and_picks_up_late_enrollments(): void
    {
        $session = $this->openedSession();

        // Retrying creates nothing new.
        $this->postJson("/api/attendance-sessions/{$session->id}/initialize")
            ->assertOk()->assertJsonPath('records_created', 0);
        $this->assertSame(2, AttendanceRecord::count());

        // A student who enrolled after the session opened is added exactly once.
        $this->makeStudent('s4@example.com', 'S4', Enrollment::STATUS_ACTIVE);
        $this->postJson("/api/attendance-sessions/{$session->id}/initialize")
            ->assertOk()->assertJsonPath('records_created', 1);
        $this->postJson("/api/attendance-sessions/{$session->id}/initialize")
            ->assertOk()->assertJsonPath('records_created', 0);

        $this->assertSame(3, AttendanceRecord::count());
    }

    public function test_database_unique_index_blocks_duplicate_records(): void
    {
        $session = $this->openedSession();

        $this->expectException(QueryException::class);

        DB::table('attendance_records')->insert([
            'attendance_session_id' => $session->id,
            'student_id' => $this->s1->id,
            'status' => 'PENDING',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function test_other_lecturer_cannot_open_or_read_roster(): void
    {
        $session = $this->makeSession($this->cs1);
        Sanctum::actingAs($this->lecturer2->user);

        $this->postJson("/api/attendance-sessions/{$session->id}/open")->assertForbidden();
        $this->getJson("/api/attendance-sessions/{$session->id}/students")->assertForbidden();

        $this->assertSame('SCHEDULED', $session->fresh()->status);
    }

    public function test_roster_lists_students_without_account_emails(): void
    {
        $session = $this->openedSession();

        $this->getJson("/api/attendance-sessions/{$session->id}/students")
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.student.student_code', 'S1')
            ->assertJsonMissingPath('data.0.student.account');
    }

    // ----------------------------------------------------------------- marking

    public function test_marking_present_updates_record_and_writes_audit_log(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);

        $this->patchJson($this->markUrl($session, $record), ['status' => 'PRESENT'])
            ->assertOk()
            ->assertJsonPath('data.status', 'PRESENT')
            ->assertJsonPath('data.marked_by', $this->lecturer1->user_id);

        $this->assertDatabaseHas('attendance_audit_logs', [
            'attendance_record_id' => $record->id,
            'attendance_session_id' => $session->id,
            'actor_id' => $this->lecturer1->user_id,
            'old_status' => 'PENDING',
            'new_status' => 'PRESENT',
        ]);
    }

    public function test_excused_requires_a_note(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);

        $this->patchJson($this->markUrl($session, $record), ['status' => 'EXCUSED'])
            ->assertStatus(422)->assertJsonValidationErrors('note');

        $this->patchJson($this->markUrl($session, $record), ['status' => 'EXCUSED', 'note' => 'Medical certificate'])
            ->assertOk()->assertJsonPath('data.note', 'Medical certificate');
    }

    public function test_pending_is_not_a_valid_target_status(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);

        $this->patchJson($this->markUrl($session, $record), ['status' => 'PENDING'])
            ->assertStatus(422)->assertJsonValidationErrors('status');
    }

    public function test_correction_requires_reason_and_is_audited(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);

        $this->patchJson($this->markUrl($session, $record), ['status' => 'ABSENT'])->assertOk();

        // Changing an already-marked record without a reason is rejected.
        $this->patchJson($this->markUrl($session, $record), ['status' => 'LATE'])
            ->assertStatus(422)->assertJsonValidationErrors('reason');
        $this->assertSame('ABSENT', $record->fresh()->status);

        $this->patchJson($this->markUrl($session, $record), ['status' => 'LATE', 'reason' => 'Arrived after roll call'])
            ->assertOk()->assertJsonPath('data.status', 'LATE');

        $this->assertSame(2, AttendanceAuditLog::where('attendance_record_id', $record->id)->count());
        $this->assertDatabaseHas('attendance_audit_logs', [
            'attendance_record_id' => $record->id,
            'old_status' => 'ABSENT',
            'new_status' => 'LATE',
            'reason' => 'Arrived after roll call',
        ]);
    }

    public function test_repeating_the_same_mark_creates_no_extra_audit_log(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);

        $this->patchJson($this->markUrl($session, $record), ['status' => 'PRESENT'])->assertOk();
        $this->patchJson($this->markUrl($session, $record), ['status' => 'PRESENT'])->assertOk();

        $this->assertSame(1, AttendanceAuditLog::where('attendance_record_id', $record->id)->count());
    }

    public function test_cannot_mark_when_session_is_not_open(): void
    {
        $session = $this->makeSession($this->cs1, 'SCHEDULED');
        $record = AttendanceRecord::create(['attendance_session_id' => $session->id, 'student_id' => $this->s1->id]);
        Sanctum::actingAs($this->lecturer1->user);

        $this->patchJson($this->markUrl($session, $record), ['status' => 'PRESENT'])->assertStatus(409);
        $this->assertSame('PENDING', $record->fresh()->status);
    }

    public function test_other_lecturer_cannot_mark_or_read_audit_logs(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);

        Sanctum::actingAs($this->lecturer2->user);

        $this->patchJson($this->markUrl($session, $record), ['status' => 'PRESENT'])->assertForbidden();
        $this->getJson("/api/attendance-sessions/{$session->id}/audit-logs")->assertForbidden();
        $this->assertSame('PENDING', $record->fresh()->status);
    }

    public function test_student_cannot_mark_attendance(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);

        Sanctum::actingAs($this->s1->user);

        $this->patchJson($this->markUrl($session, $record), ['status' => 'PRESENT'])->assertForbidden();
        $this->assertSame('PENDING', $record->fresh()->status);
    }

    public function test_record_from_another_session_returns_404(): void
    {
        $sessionA = $this->openedSession('2026-10-05');
        $sessionB = $this->openedSession('2026-10-12');
        $recordOfB = $this->recordFor($sessionB, $this->s1);

        $this->patchJson($this->markUrl($sessionA, $recordOfB), ['status' => 'PRESENT'])->assertNotFound();
        $this->assertSame('PENDING', $recordOfB->fresh()->status);
    }

    public function test_admin_can_mark_any_session(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);

        Sanctum::actingAs($this->makeUser('ADMIN', 'admin@example.com'));

        $this->patchJson($this->markUrl($session, $record), ['status' => 'PRESENT'])->assertOk();
    }

    // ------------------------------------------------------------------- close

    public function test_close_converts_pending_to_absent_with_audit_logs(): void
    {
        $session = $this->openedSession();
        $this->patchJson($this->markUrl($session, $this->recordFor($session, $this->s1)), ['status' => 'PRESENT'])->assertOk();

        $this->postJson("/api/attendance-sessions/{$session->id}/close")
            ->assertOk()
            ->assertJsonPath('data.status', 'CLOSED')
            ->assertJsonPath('auto_absent', 1)
            ->assertJsonPath('data.summary.present', 1)
            ->assertJsonPath('data.summary.absent', 1)
            ->assertJsonPath('data.summary.pending', 0);

        $s2Record = $this->recordFor($session, $this->s2);
        $this->assertSame('ABSENT', $s2Record->status);
        $this->assertDatabaseHas('attendance_audit_logs', [
            'attendance_record_id' => $s2Record->id,
            'old_status' => 'PENDING',
            'new_status' => 'ABSENT',
            'actor_id' => $this->lecturer1->user_id,
        ]);
        $this->assertNotNull($session->fresh()->closed_at);
        $this->assertSame(0, AttendanceRecord::where('status', 'PENDING')->count());
    }

    public function test_closed_session_rejects_changes_and_second_close(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);
        $this->postJson("/api/attendance-sessions/{$session->id}/close")->assertOk();

        $this->patchJson($this->markUrl($session, $record), ['status' => 'PRESENT', 'reason' => 'x'])->assertStatus(409);
        $this->postJson("/api/attendance-sessions/{$session->id}/close")->assertStatus(409);
        $this->postJson("/api/attendance-sessions/{$session->id}/initialize")->assertStatus(409);
        $this->postJson("/api/attendance-sessions/{$session->id}/open")->assertStatus(409);
    }

    public function test_only_scheduled_sessions_can_be_cancelled(): void
    {
        $scheduled = $this->makeSession($this->cs1, 'SCHEDULED', '2026-10-05');
        $open = $this->openedSession('2026-10-12');

        $this->postJson("/api/attendance-sessions/{$scheduled->id}/cancel")
            ->assertOk()->assertJsonPath('data.status', 'CANCELLED');
        $this->postJson("/api/attendance-sessions/{$open->id}/cancel")->assertStatus(409);
        $this->postJson("/api/attendance-sessions/{$scheduled->id}/open")->assertStatus(409);
    }

    // -------------------------------------------------------------- audit logs

    public function test_owner_reads_audit_logs_and_logs_are_immutable(): void
    {
        $session = $this->openedSession();
        $record = $this->recordFor($session, $this->s1);
        $this->patchJson($this->markUrl($session, $record), ['status' => 'PRESENT'])->assertOk();

        $this->getJson("/api/attendance-sessions/{$session->id}/audit-logs")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.new_status', 'PRESENT')
            ->assertJsonPath('data.0.actor.id', $this->lecturer1->user_id);

        $this->expectException(LogicException::class);
        AttendanceAuditLog::first()->update(['reason' => 'tampering']);
    }

    // --------------------------------------------------- student history

    public function test_student_reads_only_own_history_with_summary(): void
    {
        $session = $this->openedSession();
        $this->patchJson($this->markUrl($session, $this->recordFor($session, $this->s1)), ['status' => 'PRESENT'])->assertOk();

        Sanctum::actingAs($this->s1->user);

        $this->getJson("/api/students/{$this->s1->id}/attendance")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'PRESENT')
            ->assertJsonPath('summary.present', 1)
            ->assertJsonPath('summary.total', 1);

        $this->getJson("/api/students/{$this->s2->id}/attendance")->assertForbidden();
    }

    public function test_lecturer_history_is_limited_to_own_sessions(): void
    {
        $this->openedSession(); // cs1 / lecturer1

        $otherSession = $this->makeSession($this->cs2, 'SCHEDULED', '2026-10-06');
        Sanctum::actingAs($this->lecturer2->user);
        $this->postJson("/api/attendance-sessions/{$otherSession->id}/open")->assertOk();

        // lecturer2 sees only the record from their own session, not lecturer1's.
        $this->getJson("/api/students/{$this->s1->id}/attendance")
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.attendance_session_id', $otherSession->id);

        Sanctum::actingAs($this->makeUser('ADMIN', 'admin@example.com'));
        $this->getJson("/api/students/{$this->s1->id}/attendance")->assertOk()->assertJsonCount(2, 'data');
    }

    public function test_history_supports_status_and_date_filters(): void
    {
        $a = $this->openedSession('2026-10-05');
        $b = $this->openedSession('2026-10-12');
        $this->patchJson($this->markUrl($a, $this->recordFor($a, $this->s1)), ['status' => 'LATE'])->assertOk();

        Sanctum::actingAs($this->makeUser('ADMIN', 'admin@example.com'));

        $this->getJson("/api/students/{$this->s1->id}/attendance?status=LATE")
            ->assertOk()->assertJsonCount(1, 'data');
        $this->getJson("/api/students/{$this->s1->id}/attendance?date_from=2026-10-10")
            ->assertOk()->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.attendance_session_id', $b->id);
        $this->getJson("/api/students/{$this->s1->id}/attendance?status=BOGUS")->assertStatus(422);
    }
}
