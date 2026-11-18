<?php

namespace App\Services;

use App\Exceptions\AttendanceConflictException;
use App\Models\AttendanceAuditLog;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\ClassSubject;
use App\Models\Enrollment;
use App\Models\Timetable;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * All attendance business rules live here. Controllers only authorize and delegate.
 *
 * Locking order is always: session row first, then record rows. A consistent order
 * prevents deadlocks when two requests touch the same session.
 */
class AttendanceService
{
    public function createSession(User $actor, array $data): AttendanceSession
    {
        $classSubject = ClassSubject::with('semester')->findOrFail($data['class_subject_id']);

        if (! empty($data['timetable_id'])
            && ! Timetable::where('id', $data['timetable_id'])->where('class_subject_id', $classSubject->id)->exists()) {
            throw ValidationException::withMessages([
                'timetable_id' => ['The timetable does not belong to this class-subject.'],
            ]);
        }

        $semester = $classSubject->semester;
        if ($data['session_date'] < $semester->start_date->toDateString()
            || $data['session_date'] > $semester->end_date->toDateString()) {
            throw ValidationException::withMessages([
                'session_date' => ['The session date must be within the semester.'],
            ]);
        }

        // Application-level duplicate guard (there is no DB unique index for this).
        $duplicate = AttendanceSession::where('class_subject_id', $classSubject->id)
            ->whereDate('session_date', $data['session_date'])
            ->where('start_time', $data['start_time'] . ':00')
            ->where('status', '!=', AttendanceSession::STATUS_CANCELLED)
            ->exists();

        if ($duplicate) {
            throw new AttendanceConflictException('A session already exists for this class-subject at this date and time.');
        }

        // Store times as HH:MM:SS so comparisons behave the same on MySQL and SQLite.
        $session = new AttendanceSession(Arr::only($data, [
            'class_subject_id', 'timetable_id', 'session_date',
        ]) + [
            'start_time' => $data['start_time'] . ':00',
            'end_time' => $data['end_time'] . ':00',
        ]);
        $session->forceFill([
            'status' => AttendanceSession::STATUS_SCHEDULED,
            'created_by' => $actor->id,
        ])->save();

        return $session;
    }

    /**
     * SCHEDULED -> OPEN and create the PENDING roster, atomically.
     *
     * @return array{0: AttendanceSession, 1: int} the session and how many records were created
     */
    public function open(AttendanceSession $session): array
    {
        return DB::transaction(function () use ($session) {
            $locked = $this->lockSession($session);

            if ($locked->status !== AttendanceSession::STATUS_SCHEDULED) {
                throw new AttendanceConflictException('Only SCHEDULED sessions can be opened.');
            }

            $locked->forceFill([
                'status' => AttendanceSession::STATUS_OPEN,
                'opened_at' => now(),
            ])->save();

            return [$locked, $this->syncRoster($locked)];
        });
    }

    /**
     * Idempotent: re-running only adds students who are enrolled but have no record yet.
     */
    public function initializeRoster(AttendanceSession $session): int
    {
        return DB::transaction(function () use ($session) {
            $locked = $this->lockSession($session);
            $this->assertOpen($locked);

            return $this->syncRoster($locked);
        });
    }

    public function mark(
        AttendanceSession $session,
        AttendanceRecord $record,
        User $actor,
        string $status,
        array $input
    ): AttendanceRecord {
        return DB::transaction(function () use ($session, $record, $actor, $status, $input) {
            $locked = $this->lockSession($session);
            $this->assertOpen($locked);

            $row = AttendanceRecord::where('attendance_session_id', $locked->id)
                ->whereKey($record->id)
                ->lockForUpdate()
                ->firstOrFail();

            $oldStatus = $row->status;
            $noteGiven = array_key_exists('note', $input);
            $newNote = $noteGiven ? $input['note'] : $row->note;
            $reason = $input['reason'] ?? null;

            if ($oldStatus === $status && $newNote === $row->note) {
                return $row; // nothing changed: idempotent retry, no audit noise
            }

            // Changing something that was already marked is a correction and needs a reason.
            if ($oldStatus !== AttendanceRecord::STATUS_PENDING && blank($reason)) {
                throw ValidationException::withMessages([
                    'reason' => ['A reason is required when correcting an attendance record.'],
                ]);
            }

            $row->forceFill([
                'status' => $status,
                'note' => $newNote,
                'marked_by' => $actor->id,
                'marked_at' => now(),
            ])->save();

            AttendanceAuditLog::create([
                'attendance_record_id' => $row->id,
                'attendance_session_id' => $locked->id,
                'actor_id' => $actor->id,
                'old_status' => $oldStatus,
                'new_status' => $status,
                'reason' => $reason ?? ($input['note'] ?? null),
            ]);

            return $row;
        });
    }

    /**
     * OPEN -> CLOSED. Remaining PENDING records become ABSENT, each one audited,
     * all inside one transaction: either everything happens or nothing does.
     *
     * @return array{0: AttendanceSession, 1: int} the session and the number auto-marked ABSENT
     */
    public function close(AttendanceSession $session, User $actor): array
    {
        return DB::transaction(function () use ($session, $actor) {
            $locked = $this->lockSession($session);
            $this->assertOpen($locked);

            $pendingIds = AttendanceRecord::where('attendance_session_id', $locked->id)
                ->where('status', AttendanceRecord::STATUS_PENDING)
                ->lockForUpdate()
                ->pluck('id');

            $now = now();

            if ($pendingIds->isNotEmpty()) {
                AttendanceRecord::whereIn('id', $pendingIds)->update([
                    'status' => AttendanceRecord::STATUS_ABSENT,
                    'marked_by' => $actor->id,
                    'marked_at' => $now,
                    'updated_at' => $now,
                ]);

                foreach ($pendingIds->chunk(500) as $chunk) {
                    DB::table('attendance_audit_logs')->insert(
                        $chunk->map(fn ($id) => [
                            'attendance_record_id' => $id,
                            'attendance_session_id' => $locked->id,
                            'actor_id' => $actor->id,
                            'old_status' => AttendanceRecord::STATUS_PENDING,
                            'new_status' => AttendanceRecord::STATUS_ABSENT,
                            'reason' => 'Automatically marked ABSENT when the session was closed.',
                            'created_at' => $now,
                        ])->all()
                    );
                }
            }

            $locked->forceFill([
                'status' => AttendanceSession::STATUS_CLOSED,
                'closed_at' => $now,
            ])->save();

            return [$locked, $pendingIds->count()];
        });
    }

    /** Only a SCHEDULED session (which has no records yet) can be cancelled. */
    public function cancel(AttendanceSession $session): AttendanceSession
    {
        return DB::transaction(function () use ($session) {
            $locked = $this->lockSession($session);

            if ($locked->status !== AttendanceSession::STATUS_SCHEDULED) {
                throw new AttendanceConflictException('Only SCHEDULED sessions can be cancelled.');
            }

            $locked->forceFill(['status' => AttendanceSession::STATUS_CANCELLED])->save();

            return $locked;
        });
    }

    /**
     * Count records per status for any records query.
     *
     * @return array{pending:int, present:int, absent:int, late:int, excused:int, total:int}
     */
    public function summarize(Builder $records): array
    {
        $counts = (clone $records)
            ->reorder()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        $summary = [
            'pending' => (int) ($counts[AttendanceRecord::STATUS_PENDING] ?? 0),
            'present' => (int) ($counts[AttendanceRecord::STATUS_PRESENT] ?? 0),
            'absent' => (int) ($counts[AttendanceRecord::STATUS_ABSENT] ?? 0),
            'late' => (int) ($counts[AttendanceRecord::STATUS_LATE] ?? 0),
            'excused' => (int) ($counts[AttendanceRecord::STATUS_EXCUSED] ?? 0),
        ];
        $summary['total'] = array_sum($summary);

        return $summary;
    }

    private function lockSession(AttendanceSession $session): AttendanceSession
    {
        return AttendanceSession::with('classSubject')
            ->whereKey($session->id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function assertOpen(AttendanceSession $session): void
    {
        if (! $session->isOpen()) {
            throw new AttendanceConflictException("The session is {$session->status}; only OPEN sessions can be changed.");
        }
    }

    /**
     * INSERT IGNORE one PENDING record per ACTIVE enrollment. The UNIQUE(session, student)
     * index makes duplicates impossible even if two requests run at the same instant.
     */
    private function syncRoster(AttendanceSession $session): int
    {
        $studentIds = Enrollment::where('class_id', $session->classSubject->class_id)
            ->where('status', Enrollment::STATUS_ACTIVE)
            ->pluck('student_id');

        $now = now();
        $created = 0;

        foreach ($studentIds->chunk(500) as $chunk) {
            $created += DB::table('attendance_records')->insertOrIgnore(
                $chunk->map(fn ($studentId) => [
                    'attendance_session_id' => $session->id,
                    'student_id' => $studentId,
                    'status' => AttendanceRecord::STATUS_PENDING,
                    'created_at' => $now,
                    'updated_at' => $now,
                ])->all()
            );
        }

        return $created;
    }
}
