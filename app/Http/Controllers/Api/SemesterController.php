<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SemesterRequest;
use App\Http\Resources\SemesterResource;
use App\Models\Semester;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SemesterController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));
        $search = trim((string) $request->query('q', ''));

        $semesters = Semester::query()
            ->with('academicYear')
            ->when($request->filled('academic_year_id'), fn ($q) => $q->where('academic_year_id', $request->integer('academic_year_id')))
            ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderByDesc('start_date')
            ->paginate($perPage)
            ->withQueryString();

        return SemesterResource::collection($semesters);
    }

    public function show(Semester $semester): SemesterResource
    {
        return new SemesterResource($semester->load('academicYear'));
    }

    public function store(SemesterRequest $request): JsonResponse
    {
        $semester = Semester::create($request->validated());

        return (new SemesterResource($semester->load('academicYear')))->response()->setStatusCode(201);
    }

    public function update(SemesterRequest $request, Semester $semester): SemesterResource
    {
        $semester->update($request->validated());

        return new SemesterResource($semester->load('academicYear'));
    }

    public function destroy(Semester $semester): JsonResponse
    {
        if ($semester->classSubjects()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this semester still has class-subject assignments.',
            ], 409);
        }

        $semester->delete();

        return response()->json(['success' => true, 'message' => 'Semester deleted.']);
    }
}
