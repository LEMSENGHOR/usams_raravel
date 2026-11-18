<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LecturerRequest;
use App\Http\Resources\LecturerResource;
use App\Models\Lecturer;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

class LecturerController extends Controller
{
    private const PROFILE_FIELDS = ['department_id', 'lecturer_code', 'full_name', 'academic_title'];

    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));
        $search = trim((string) $request->query('q', ''));

        $lecturers = Lecturer::query()
            ->with(['department', 'user'])
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('lecturer_code', 'like', "%{$search}%")
                ->orWhere('full_name', 'like', "%{$search}%")))
            ->orderBy('lecturer_code')
            ->paginate($perPage)
            ->withQueryString();

        return LecturerResource::collection($lecturers);
    }

    public function show(Lecturer $lecturer): LecturerResource
    {
        return new LecturerResource($lecturer->load(['department', 'user']));
    }

    public function store(LecturerRequest $request): JsonResponse
    {
        $data = $request->validated();

        $lecturer = DB::transaction(function () use ($data) {
            $user = new User([
                'name' => $data['full_name'],
                'email' => $data['email'],
                'password' => $data['password'],
            ]);
            $user->role = User::ROLE_LECTURER; // never taken from client input
            $user->status = $data['status'] ?? 'ACTIVE';
            $user->save();

            return Lecturer::create(['user_id' => $user->id] + Arr::only($data, self::PROFILE_FIELDS));
        });

        return (new LecturerResource($lecturer->load(['department', 'user'])))->response()->setStatusCode(201);
    }

    public function update(LecturerRequest $request, Lecturer $lecturer): LecturerResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $lecturer) {
            $lecturer->update(Arr::only($data, self::PROFILE_FIELDS));

            $user = $lecturer->user;
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

        return new LecturerResource($lecturer->fresh(['department', 'user']));
    }

    public function destroy(Lecturer $lecturer): JsonResponse
    {
        if ($lecturer->classSubjects()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this lecturer has class assignments. Set status to INACTIVE instead.',
            ], 409);
        }

        DB::transaction(function () use ($lecturer) {
            $user = $lecturer->user;
            $lecturer->delete();
            $user?->delete();
        });

        return response()->json(['success' => true, 'message' => 'Lecturer deleted.']);
    }
}
