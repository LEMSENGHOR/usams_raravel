<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ClassSubjectRequest;
use App\Http\Resources\ClassSubjectResource;
use App\Models\ClassSubject;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassSubjectController extends Controller
{
    private const WITH = ['schoolClass', 'subject', 'lecturer', 'semester'];

    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));

        $items = ClassSubject::query()
            ->visibleTo($request->user()) // lecturers/students only see their own rows
            ->with(self::WITH)
            ->when($request->filled('class_id'), fn ($q) => $q->where('class_id', $request->integer('class_id')))
            ->when($request->filled('subject_id'), fn ($q) => $q->where('subject_id', $request->integer('subject_id')))
            ->when($request->filled('lecturer_id'), fn ($q) => $q->where('lecturer_id', $request->integer('lecturer_id')))
            ->when($request->filled('semester_id'), fn ($q) => $q->where('semester_id', $request->integer('semester_id')))
            ->orderBy('id')
            ->paginate($perPage)
            ->withQueryString();

        return ClassSubjectResource::collection($items);
    }

    public function show(Request $request, ClassSubject $classSubject): ClassSubjectResource
    {
        abort_unless(
            ClassSubject::visibleTo($request->user())->whereKey($classSubject->id)->exists(),
            403,
            'You do not have permission to view this assignment.'
        );

        return new ClassSubjectResource($classSubject->load(self::WITH));
    }

    public function store(ClassSubjectRequest $request): JsonResponse
    {
        $data = $request->validated();

        $exists = ClassSubject::where('class_id', $data['class_id'])
            ->where('subject_id', $data['subject_id'])
            ->where('semester_id', $data['semester_id'])
            ->exists();

        if ($exists) {
            return $this->duplicate();
        }

        try {
            $item = ClassSubject::create($data);
        } catch (QueryException $e) {
            // The unique index is the final guard against two simultaneous requests.
            if ($e->getCode() === '23000') {
                return $this->duplicate();
            }
            throw $e;
        }

        return (new ClassSubjectResource($item->load(self::WITH)))->response()->setStatusCode(201);
    }

    public function update(ClassSubjectRequest $request, ClassSubject $classSubject): ClassSubjectResource
    {
        $classSubject->update($request->validated());

        return new ClassSubjectResource($classSubject->load(self::WITH));
    }

    public function destroy(ClassSubject $classSubject): JsonResponse
    {
        if ($classSubject->timetables()->exists() || $classSubject->attendanceSessions()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this assignment has timetables or attendance sessions.',
            ], 409);
        }

        $classSubject->delete();

        return response()->json(['success' => true, 'message' => 'Class-subject assignment deleted.']);
    }

    private function duplicate(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'This subject is already assigned to this class in this semester.',
        ], 409);
    }
}
