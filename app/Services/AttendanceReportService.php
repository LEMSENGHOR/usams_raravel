<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Attendance report queries.
 *
 * PERCENTAGE FORMULA (applied everywhere, JSON and CSV):
 *
 *   attendance_percentage = (PRESENT + LATE) / (PRESENT + LATE + ABSENT) * 100
 *
 *  - LATE counts as attended.
 *  - EXCUSED is excluded from the denominator (an excused absence neither helps nor hurts).
 *  - PENDING is excluded too (not decided yet); it is reported separately.
 *  - When the denominator is 0 the percentage is null, never 0 and never a division error.
 *
 * Visibility:
 *  - ADMIN / SUPER_ADMIN: every record.
 *  - LECTURER: only records of class-subjects assigned to them (enforced in SQL, not by the client).
 *  - anyone else: nothing.
 */
class AttendanceReportService
{
    public const GROUPS = ['date', 'class', 'subject', 'student', 'lecturer', 'semester'];

    private const AGGREGATES = "
        SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) AS present_count,
        SUM(CASE WHEN ar.status = 'ABSENT'  THEN 1 ELSE 0 END) AS absent_count,
        SUM(CASE WHEN ar.status = 'LATE'    THEN 1 ELSE 0 END) AS late_count,
        SUM(CASE WHEN ar.status = 'EXCUSED' THEN 1 ELSE 0 END) AS excused_count,
        SUM(CASE WHEN ar.status = 'PENDING' THEN 1 ELSE 0 END) AS pending_count,
        COUNT(*) AS total_count";

    /**
     * Records joined to their session and class-subject, scoped to the caller and filtered.
     */
    public function filtered(User $user, array $filters): Builder
    {
        $query = DB::table('attendance_records as ar')
            ->join('attendance_sessions as s', 's.id', '=', 'ar.attendance_session_id')
            ->join('class_subjects as cs', 'cs.id', '=', 's.class_subject_id')
            ->whereIn('s.status', ['OPEN', 'CLOSED']);

        if (! $user->isAdmin()) {
            $lecturerId = $user->hasRole(User::ROLE_LECTURER) ? $user->lecturer?->id : null;

            $lecturerId !== null
                ? $query->where('cs.lecturer_id', $lecturerId)
                : $query->whereRaw('1 = 0');
        }

        return $query
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereDate('s.session_date', '>=', $v))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereDate('s.session_date', '<=', $v))
            ->when($filters['class_id'] ?? null, fn ($q, $v) => $q->where('cs.class_id', $v))
            ->when($filters['subject_id'] ?? null, fn ($q, $v) => $q->where('cs.subject_id', $v))
            ->when($filters['lecturer_id'] ?? null, fn ($q, $v) => $q->where('cs.lecturer_id', $v))
            ->when($filters['semester_id'] ?? null, fn ($q, $v) => $q->where('cs.semester_id', $v))
            ->when($filters['class_subject_id'] ?? null, fn ($q, $v) => $q->where('cs.id', $v))
            ->when($filters['student_id'] ?? null, fn ($q, $v) => $q->where('ar.student_id', $v));
    }

    public function grouped(User $user, array $filters, string $group): Builder
    {
        $def = $this->definition($group);
        $query = $this->filtered($user, $filters);

        foreach ($def['joins'] as [$table, $first, $second]) {
            $query->join($table, $first, '=', $second);
        }

        $query->selectRaw(
            "{$def['id']} AS group_id, {$def['code']} AS code, {$def['label']} AS label, " . self::AGGREGATES
        );

        foreach ($def['group'] as $column) {
            $query->groupBy($column);
        }

        return $query->orderBy($def['order'][0], $def['order'][1]);
    }

    /** Overall totals for the same filters (one row, no grouping). */
    public function totals(User $user, array $filters): array
    {
        $row = $this->filtered($user, $filters)->selectRaw(self::AGGREGATES)->first();

        return $this->shape($row, ['group_id' => null, 'code' => null, 'label' => null]);
    }

    /** Turn a raw aggregate row into the public JSON shape. */
    public function shape(object $row, ?array $identity = null): array
    {
        // SUM() over zero rows is NULL, so cast everything to int.
        $present = (int) $row->present_count;
        $absent = (int) $row->absent_count;
        $late = (int) $row->late_count;

        return ($identity ?? [
            'group_id' => $row->group_id,
            'code' => $row->code,
            'label' => $row->label,
        ]) + [
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'excused' => (int) $row->excused_count,
            'pending' => (int) $row->pending_count,
            'total' => (int) $row->total_count,
            'attendance_percentage' => self::percentage($present, $late, $absent),
        ];
    }

    public static function percentage(int $present, int $late, int $absent): ?float
    {
        $denominator = $present + $late + $absent;

        return $denominator === 0 ? null : round((($present + $late) / $denominator) * 100, 2);
    }

    public static function formulaDescription(): string
    {
        return 'attendance_percentage = (PRESENT + LATE) / (PRESENT + LATE + ABSENT) * 100; '
            . 'EXCUSED and PENDING are excluded from the denominator; null when the denominator is 0.';
    }

    /**
     * @return array{joins: array<int, array{0:string,1:string,2:string}>, id:string, code:string, label:string, group:array<int,string>, order:array{0:string,1:string}}
     */
    private function definition(string $group): array
    {
        return match ($group) {
            'date' => [
                'joins' => [],
                'id' => 's.session_date', 'code' => 's.session_date', 'label' => 's.session_date',
                'group' => ['s.session_date'],
                'order' => ['s.session_date', 'desc'],
            ],
            'class' => [
                'joins' => [['classes as c', 'c.id', 'cs.class_id']],
                'id' => 'c.id', 'code' => 'c.code', 'label' => 'c.name',
                'group' => ['c.id', 'c.code', 'c.name'],
                'order' => ['c.code', 'asc'],
            ],
            'subject' => [
                'joins' => [['subjects as sub', 'sub.id', 'cs.subject_id']],
                'id' => 'sub.id', 'code' => 'sub.code', 'label' => 'sub.name',
                'group' => ['sub.id', 'sub.code', 'sub.name'],
                'order' => ['sub.code', 'asc'],
            ],
            'student' => [
                'joins' => [['students as st', 'st.id', 'ar.student_id']],
                'id' => 'st.id', 'code' => 'st.student_code', 'label' => 'st.full_name',
                'group' => ['st.id', 'st.student_code', 'st.full_name'],
                'order' => ['st.student_code', 'asc'],
            ],
            'lecturer' => [
                'joins' => [['lecturers as l', 'l.id', 'cs.lecturer_id']],
                'id' => 'l.id', 'code' => 'l.lecturer_code', 'label' => 'l.full_name',
                'group' => ['l.id', 'l.lecturer_code', 'l.full_name'],
                'order' => ['l.lecturer_code', 'asc'],
            ],
            'semester' => [
                'joins' => [
                    ['semesters as sem', 'sem.id', 'cs.semester_id'],
                    ['academic_years as ay', 'ay.id', 'sem.academic_year_id'],
                ],
                'id' => 'sem.id', 'code' => 'ay.name', 'label' => 'sem.name',
                'group' => ['sem.id', 'ay.name', 'sem.name'],
                'order' => ['ay.name', 'asc'],
            ],
        };
    }
}
