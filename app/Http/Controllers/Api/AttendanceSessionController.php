<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Events\AttendanceUpdated;
use App\Http\Requests\MarkAttendanceRequest;
use App\Http\Requests\StoreAttendanceSessionRequest;
use App\Http\Resources\AttendanceAuditLogResource;
use App\Http\Resources\AttendanceRecordResource;
use App\Http\Resources\AttendanceSessionResource;
use App\Models\AttendanceAuditLog;
use App\Models\AttendanceRecord;
use App\Models\AttendanceSession;
use App\Models\ClassSubject;
use App\Models\Student;
use App\Services\AttendanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AttendanceSessionController extends Controller
{
    private const SESSION_WITH = ['classSubject.schoolClass', 'classSubject.subject',    'classSubject.lecturer',
 'classSubject.semester'];

    public function __construct(private readonly AttendanceService $attendance)
    {
    }

    public function index(Request $request)
    {
        Gate::authorize('viewAny', AttendanceSession::class);

        $data = $request->validate([
            'class_subject_id' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::in(['SCHEDULED', 'OPEN', 'CLOSED', 'CANCELLED'])],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
            'per_page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = max(1, min((int) ($data['per_page'] ?? 15), 100));

        $sessions = AttendanceSession::query()
            ->visibleTo($request->user()) // a lecturer never sees another lecturer's sessions
            ->with(self::SESSION_WITH)
            ->withCount('records')
            ->when($data['class_subject_id'] ?? null, fn ($q, $v) => $q->where('class_subject_id', $v))
            ->when($data['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($data['date_from'] ?? null, fn ($q, $v) => $q->whereDate('session_date', '>=', $v))
            ->when($data['date_to'] ?? null, fn ($q, $v) => $q->whereDate('session_date', '<=', $v))
            ->orderByDesc('session_date')
            ->orderByDesc('start_time')
            ->paginate($perPage)
            ->withQueryString();

        return AttendanceSessionResource::collection($sessions);
    }

    public function store(StoreAttendanceSessionRequest $request): JsonResponse
    {
        $classSubject = ClassSubject::findOrFail($request->integer('class_subject_id'));

        Gate::authorize('create', [AttendanceSession::class, $classSubject]);

        $session = $this->attendance->createSession($request->user(), $request->validated());

        return (new AttendanceSessionResource($session->load(self::SESSION_WITH)))
            ->response()
            ->setStatusCode(201);
    }

    public function show(AttendanceSession $session): AttendanceSessionResource
    {
        Gate::authorize('view', $session);

        $summary = $this->attendance->summarize(
            AttendanceRecord::where('attendance_session_id', $session->id)
        );

        return (new AttendanceSessionResource($session->load(self::SESSION_WITH)))->withSummary($summary);
    }

    // public function open(AttendanceSession $session): AttendanceSessionResource
    // {
    //     Gate::authorize('manage', $session);

    //     [$opened, $created] = $this->attendance->open($session);

    //     return (new AttendanceSessionResource($opened->load(self::SESSION_WITH)))
    //         ->withSummary($this->summaryFor($opened))
    //         ->additional(['records_created' => $created]);
    // }

public function open(AttendanceSession $session): AttendanceSessionResource
{
    Gate::authorize('manage', $session);

    [$opened, $created] = $this->attendance->open($session);

    $summary = $this->summaryFor($opened);

    event(new AttendanceUpdated(
        sessionId: (int) $opened->id,
        action: 'session_opened',
        data: [
            'status' => $opened->status,
            'records_created' => $created,
            'summary' => $summary,
        ],
    ));

    return (new AttendanceSessionResource($opened->load(self::SESSION_WITH)))
        ->withSummary($summary)
        ->additional(['records_created' => $created]);
}


    public function initialize(AttendanceSession $session): AttendanceSessionResource
    {
        Gate::authorize('manage', $session);

        $created = $this->attendance->initializeRoster($session);

        return (new AttendanceSessionResource($session->refresh()))
            ->withSummary($this->summaryFor($session))
            ->additional(['records_created' => $created]);
    }

    public function students(Request $request, AttendanceSession $session)
    {
        Gate::authorize('view', $session);

        $data = $request->validate([
            'status' => ['nullable', Rule::in(['PENDING', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])],
            'per_page' => ['nullable', 'integer', 'min:1'],
        ]);

        $perPage = max(1, min((int) ($data['per_page'] ?? 50), 200));

        $records = AttendanceRecord::query()
            ->where('attendance_session_id', $session->id)
            ->when($data['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->with('student') // the "user" relation is not loaded, so e-mails are not exposed here
            ->orderBy(
                Student::select('student_code')->whereColumn('students.id', 'attendance_records.student_id')
            )
            ->paginate($perPage)
            ->withQueryString();

        return AttendanceRecordResource::collection($records);
    }

    public function mark(MarkAttendanceRequest $request, AttendanceSession $session, AttendanceRecord $record): AttendanceRecordResource
    {
        Gate::authorize('manage', $session);

        // Never trust the URL: the record must belong to this session.
        abort_unless((int) $record->attendance_session_id === (int) $session->id, 404);

        $marked = $this->attendance->mark(
            $session,
            $record,
            $request->user(),
            $request->validated('status'),
            $request->safe()->only(['note', 'reason'])
        );

        $marked->load('student');

event(new AttendanceUpdated(
    sessionId: (int) $session->id,
    action: 'record_marked',
    data: [
        'record' => (new AttendanceRecordResource($marked))->resolve(),
        'summary' => $this->summaryFor($session),
    ],
));

return new AttendanceRecordResource($marked);
    }

    // public function close(Request $request, AttendanceSession $session): AttendanceSessionResource
    // {
    //     Gate::authorize('manage', $session);

    //     [$closed, $autoAbsent] = $this->attendance->close($session, $request->user());

    //     return (new AttendanceSessionResource($closed->load(self::SESSION_WITH)))
    //         ->withSummary($this->summaryFor($closed))
    //         ->additional(['auto_absent' => $autoAbsent]);
    // }

public function close(Request $request, AttendanceSession $session): AttendanceSessionResource
{
    Gate::authorize('manage', $session);

    [$closed, $autoAbsent] = $this->attendance->close($session, $request->user());

    $summary = $this->summaryFor($closed);

    event(new AttendanceUpdated(
        sessionId: (int) $closed->id,
        action: 'session_closed',
        data: [
            'status' => $closed->status,
            'auto_absent' => $autoAbsent,
            'summary' => $summary,
        ],
    ));

    return (new AttendanceSessionResource($closed->load(self::SESSION_WITH)))
        ->withSummary($summary)
        ->additional(['auto_absent' => $autoAbsent]);
}


    // public function cancel(AttendanceSession $session): AttendanceSessionResource
    // {
    //     Gate::authorize('manage', $session);

    //     return new AttendanceSessionResource(
    //         $this->attendance->cancel($session)->load(self::SESSION_WITH)
    //     );
    // }

public function cancel(AttendanceSession $session): AttendanceSessionResource
{
    Gate::authorize('manage', $session);

    $cancelled = $this->attendance->cancel($session);

    event(new AttendanceUpdated(
        sessionId: (int) $cancelled->id,
        action: 'session_cancelled',
        data: [
            'status' => $cancelled->status,
        ],
    ));

    return new AttendanceSessionResource(
        $cancelled->load(self::SESSION_WITH)
    );
}


    public function auditLogs(Request $request, AttendanceSession $session)
    {
        Gate::authorize('viewAuditLogs', $session);

        $perPage = max(1, min($request->integer('per_page', 50), 200));

        $logs = AttendanceAuditLog::query()
            ->where('attendance_session_id', $session->id)
            ->when($request->filled('attendance_record_id'), fn ($q) => $q->where('attendance_record_id', $request->integer('attendance_record_id')))
            ->with('actor')
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return AttendanceAuditLogResource::collection($logs);
    }

    private function summaryFor(AttendanceSession $session): array
    {
        return $this->attendance->summarize(
            AttendanceRecord::where('attendance_session_id', $session->id)
        );
    }

public function records(Request $request)
{
    Gate::authorize('viewAny', AttendanceSession::class);

    $data = $request->validate([
        'status' => [
            'nullable',
            Rule::in(['PENDING', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED']),
        ],
        'date_from' => ['nullable', 'date_format:Y-m-d'],
        'date_to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:date_from'],
        'per_page' => ['nullable', 'integer', 'min:1'],
    ]);

    $perPage = max(1, min((int) ($data['per_page'] ?? 15), 100));

    $records = AttendanceRecord::query()
        ->whereHas('session', function ($query) use ($request) {
            $query->visibleTo($request->user());
        })
        ->when(
            !empty($data['status']),
            fn ($query) => $query->where('status', $data['status'])
        )
        ->when(
            !empty($data['date_from']),
            fn ($query) => $query->whereHas('session', fn ($q) =>
                $q->whereDate('session_date', '>=', $data['date_from'])
            )
        )
        ->when(
            !empty($data['date_to']),
            fn ($query) => $query->whereHas('session', fn ($q) =>
                $q->whereDate('session_date', '<=', $data['date_to'])
            )
        )
        ->with([
            'student',
            'session' => fn ($query) => $query->with(self::SESSION_WITH),
        ])
        ->latest('id')
        ->paginate($perPage)
        ->withQueryString();

    return AttendanceRecordResource::collection($records);
}

}
