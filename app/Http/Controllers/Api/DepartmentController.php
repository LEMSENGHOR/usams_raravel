<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));
        $search = trim((string) $request->query('q', ''));

        $departments = Department::query()
            ->with('faculty') // eager loading: avoids N+1 queries
            ->when($request->filled('faculty_id'), fn ($q) => $q->where('faculty_id', $request->integer('faculty_id')))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%")))
            ->orderBy('code')
            ->paginate($perPage)
            ->withQueryString();

        return DepartmentResource::collection($departments);
    }

    public function show(Department $department): DepartmentResource
    {
        return new DepartmentResource($department->load('faculty')->loadCount('majors'));
    }

    public function store(DepartmentRequest $request): JsonResponse
    {
        $department = Department::create($request->validated());

        return (new DepartmentResource($department->load('faculty')))->response()->setStatusCode(201);
    }

    public function update(DepartmentRequest $request, Department $department): DepartmentResource
    {
        $department->update($request->validated());

        return new DepartmentResource($department->load('faculty'));
    }

    public function destroy(Department $department): JsonResponse
    {
        if ($department->majors()->exists()
            || $department->subjects()->exists()
            || $department->lecturers()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this department still has majors, subjects or lecturers.',
            ], 409);
        }

        $department->delete();

        return response()->json(['success' => true, 'message' => 'Department deleted.']);
    }
}
