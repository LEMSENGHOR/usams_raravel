<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AttendanceRecordResource;
use App\Models\AttendanceRecord;
use App\Models\Student;
use App\Models\User;
use App\Services\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StudentAttendanceController extends Controller
{
    public function __construct(private readonly AttendanceService $attendance)
    {
    }

    /**
     * GET /api/students/{student}/attendance
     *  - ADMIN+: any student
     *  - STUDENT: only themselves
     *  - LECTURER: only the student's records inside sessions the lecturer teaches
     */
    public function index(Request $request, Student $student)
    {
        Gate::authorize('viewAttendance', $student);

        $filters = $request->validate([
            'status' => ['nullable', Rule::in(['PENDING', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])],
            'class_subject_id' => ['nullable', 'integer'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
            'per_page' => ['nullable', 'integer', 'min:1'],
        ]);

        $user = $request->user();
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));

        $query = AttendanceRecord::query()
            ->where('student_id', $student->id)
            ->when($user->hasRole(User::ROLE_LECTURER), fn ($q) => $q->whereHas(
                'session.classSubject.lecturer',
                fn ($l) => $l->where('user_id', $user->id)
            ))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['class_subject_id'] ?? null, fn ($q, $v) => $q->whereHas(
                'session', fn ($s) => $s->where('class_subject_id', $v)
            ))
            ->when($filters['date_from'] ?? null, fn ($q, $v) => $q->whereHas(
                'session', fn ($s) => $s->whereDate('session_date', '>=', $v)
            ))
            ->when($filters['date_to'] ?? null, fn ($q, $v) => $q->whereHas(
                'session', fn ($s) => $s->whereDate('session_date', '<=', $v)
            ));

        $summary = $this->attendance->summarize($query);

        $records = $query
            ->with(['session.classSubject.subject', 'session.classSubject.schoolClass'])
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return AttendanceRecordResource::collection($records)->additional(['summary' => $summary]);
    }
}
