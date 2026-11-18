<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StudentRequest;
use App\Http\Resources\StudentResource;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    // private const PROFILE_FIELDS = ['major_id', 'student_code', 'full_name', 'gender', 'date_of_birth'];
    private const PROFILE_FIELDS = [
    'major_id',
    'student_code',
    'full_name',
    'gender',
    'date_of_birth',
    'admission_date',
];
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));
        $search = trim((string) $request->query('q', ''));

        // $students = Student::query()
        //     ->with(['major', 'user'])
        //     ->when($request->filled('major_id'), fn ($q) => $q->where('major_id', $request->integer('major_id')))
        //     ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
        //         ->where('student_code', 'like', "%{$search}%")
        //         ->orWhere('full_name', 'like', "%{$search}%")))
        //     ->orderBy('student_code')
        //     ->paginate($perPage)
        //     ->withQueryString();

        // return StudentResource::collection($students);
     $students = Student::query()
    ->with([
        'major',
        'user',
        'enrollments.schoolClass',
        'enrollments.academicYear',
    ])
    ->when(
        $request->filled('major_id'),
        fn ($q) => $q->where('major_id', $request->integer('major_id'))
    )
    ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
        ->where('student_code', 'like', "%{$search}%")
        ->orWhere('full_name', 'like', "%{$search}%")
    ))
    ->orderBy('student_code')
    ->paginate($perPage)
    ->withQueryString();

return StudentResource::collection($students);
    }

    public function show(Student $student): StudentResource
    {
        $student->load(['user', 'major']);

        return new StudentResource($student);
        // return new StudentResource($student->load(['major', 'user']));
    }

    public function store(StudentRequest $request): JsonResponse
    {
        $data = $request->validated();

        // The user account and the student profile are created together or not at all.
        $student = DB::transaction(function () use ($data) {
            $user = new User([
                'name' => $data['full_name'],
                'email' => $data['email'],
                'password' => $data['password'], // hashed by the "hashed" cast
            ]);
            $user->role = User::ROLE_STUDENT; // never taken from client input
            $user->status = $data['status'] ?? 'ACTIVE';
            $user->save();

            return Student::create(['user_id' => $user->id] + Arr::only($data, self::PROFILE_FIELDS));
        });

        return (new StudentResource($student->load(['major', 'user'])))->response()->setStatusCode(201);
    }

    public function update(StudentRequest $request, Student $student): StudentResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $student) {
            $student->update(Arr::only($data, self::PROFILE_FIELDS));

            $user = $student->user;
            if (isset($data['email'])) {
                $user->email = $data['email'];
            }
            if (isset($data['password'])) {
                $user->password = $data['password'];
            }
            if (isset($data['full_name'])) {
                $user->name = $data['full_name'];
            }
            if (isset($data['status'])) {
                $user->status = $data['status'];
            }
            $user->save();
        });

        return new StudentResource($student->fresh(['major', 'user']));
    }

    public function destroy(Student $student): JsonResponse
    {
        // Retention policy: a student with academic history is archived (status), not deleted.
        if ($student->enrollments()->exists() || $student->attendanceRecords()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this student has enrollments or attendance history. Set status to INACTIVE instead.',
            ], 409);
        }

        DB::transaction(function () use ($student) {
            $user = $student->user;
            $student->delete();
            $user?->delete();
        });

        return response()->json(['success' => true, 'message' => 'Student deleted.']);
    }
}
