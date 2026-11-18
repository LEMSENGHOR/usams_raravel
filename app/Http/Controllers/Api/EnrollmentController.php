<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\EnrollmentRequest;
use App\Http\Resources\EnrollmentResource;
use App\Models\AttendanceRecord;
use App\Models\Enrollment;
use App\Models\SchoolClass;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));

        $enrollments = Enrollment::query()
            ->visibleTo($request->user())
            ->with(['student', 'schoolClass',  'academicYear',])
            ->when($request->filled('class_id'), fn ($q) => $q->where('class_id', $request->integer('class_id')))
            ->when($request->filled('student_id'), fn ($q) => $q->where('student_id', $request->integer('student_id')))
            ->when($request->filled('academic_year_id'), fn ($q) => $q->where('academic_year_id', $request->integer('academic_year_id')))
            ->when($request->filled('status'), fn ($q) => $q->where('status', $request->query('status')))
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return EnrollmentResource::collection($enrollments);
    }

    public function show(Request $request, Enrollment $enrollment): EnrollmentResource
    {
        abort_unless(
            Enrollment::visibleTo($request->user())->whereKey($enrollment->id)->exists(),
            403,
            'You do not have permission to view this enrollment.'
        );

        return new EnrollmentResource($enrollment->load(['student', 'schoolClass']));
    }

    public function store(EnrollmentRequest $request): JsonResponse
    {
        $data = $request->validated();
        $class = SchoolClass::findOrFail($data['class_id']);

        $attributes = [
            'student_id' => $data['student_id'],
            'class_id' => $class->id,
            'academic_year_id' => $class->academic_year_id, // derived on the server
        ];

        if (Enrollment::where($attributes)->exists()) {
            return $this->duplicate();
        }

        try {
            $enrollment = Enrollment::create($attributes + ['status' => Enrollment::STATUS_ACTIVE]);
        } catch (QueryException $e) {
            if ($e->getCode() === '23000') {
                return $this->duplicate();
            }
            throw $e;
        }

        return (new EnrollmentResource($enrollment->load(['student', 'schoolClass'])))->response()->setStatusCode(201);
    }

    public function update(EnrollmentRequest $request, Enrollment $enrollment): EnrollmentResource
    {
        $enrollment->update($request->validated());

        return new EnrollmentResource($enrollment->load(['student', 'schoolClass']));
    }

    public function destroy(Enrollment $enrollment): JsonResponse
    {
        $hasAttendance = AttendanceRecord::where('student_id', $enrollment->student_id)
            ->whereHas('session.classSubject', fn ($q) => $q->where('class_id', $enrollment->class_id))
            ->exists();

        if ($hasAttendance) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: attendance exists for this enrollment. Set status to DROPPED instead.',
            ], 409);
        }

        $enrollment->delete();

        return response()->json(['success' => true, 'message' => 'Enrollment deleted.']);
    }

    private function duplicate(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'This student is already enrolled in this class for this academic year.',
        ], 409);
    }
}
