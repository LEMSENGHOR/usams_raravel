<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TimetableRequest;
use App\Http\Resources\TimetableResource;
use App\Models\Timetable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TimetableController extends Controller
{
    private const WITH = ['classSubject.schoolClass', 'classSubject.subject', 'classSubject.lecturer'];

    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));

        $timetables = Timetable::query()
            ->visibleTo($request->user())
            ->with(self::WITH)
            ->when($request->filled('class_subject_id'), fn ($q) => $q->where('class_subject_id', $request->integer('class_subject_id')))
            ->when($request->filled('day_of_week'), fn ($q) => $q->where('day_of_week', $request->integer('day_of_week')))
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->paginate($perPage)
            ->withQueryString();

        return TimetableResource::collection($timetables);
    }

    public function show(Request $request, Timetable $timetable): TimetableResource
    {
        abort_unless(
            Timetable::visibleTo($request->user())->whereKey($timetable->id)->exists(),
            403,
            'You do not have permission to view this timetable.'
        );

        return new TimetableResource($timetable->load(self::WITH));
    }

    public function store(TimetableRequest $request): JsonResponse
    {
        $timetable = Timetable::create($request->validated());

        return (new TimetableResource($timetable->load(self::WITH)))->response()->setStatusCode(201);
    }

    public function update(TimetableRequest $request, Timetable $timetable): TimetableResource
    {
        $timetable->update($request->validated());

        return new TimetableResource($timetable->load(self::WITH));
    }

    public function destroy(Timetable $timetable): JsonResponse
    {
        // attendance_sessions.timetable_id is nullOnDelete, so existing sessions are preserved.
        $timetable->delete();

        return response()->json(['success' => true, 'message' => 'Timetable deleted.']);
    }
}
