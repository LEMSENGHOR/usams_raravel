<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SchoolClassRequest;
use App\Http\Resources\SchoolClassResource;
use App\Models\SchoolClass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolClassController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));
        $search = trim((string) $request->query('q', ''));

        $classes = SchoolClass::query()
            ->with(['major', 'academicYear'])
            ->when($request->filled('major_id'), fn ($q) => $q->where('major_id', $request->integer('major_id')))
            ->when($request->filled('academic_year_id'), fn ($q) => $q->where('academic_year_id', $request->integer('academic_year_id')))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%")))
            ->orderBy('code')
            ->paginate($perPage)
            ->withQueryString();

        return SchoolClassResource::collection($classes);
    }

    public function show(SchoolClass $schoolClass): SchoolClassResource
    {
        return new SchoolClassResource($schoolClass->load(['major', 'academicYear']));
    }

    // public function store(SchoolClassRequest $request): JsonResponse
    // {
    //     $class = SchoolClass::create($request->validated());

    //     return (new SchoolClassResource($class->load(['major', 'academicYear'])))->response()->setStatusCode(201);
    // }
// public function store(SchoolClassRequest $request): JsonResponse
// {
//     $data = $request->validated();

//     $data['group_name'] = $data['group'];
//     unset($data['group']);

//     $class = SchoolClass::create($data);

//     return (new SchoolClassResource(
//         $class->load(['major', 'academicYear'])
//     ))->response()->setStatusCode(201);
// }
public function store(SchoolClassRequest $request): JsonResponse
{
    $data = $request->validated();

    $data['group_name'] = $data['group'];
    unset($data['group']);

    $class = SchoolClass::create($data);

    return (new SchoolClassResource(
        $class->load(['major', 'academicYear'])
    ))->response()->setStatusCode(201);
}
    // public function update(SchoolClassRequest $request, SchoolClass $schoolClass): SchoolClassResource
    // {
    //     $schoolClass->update($request->validated());

    //     return new SchoolClassResource($schoolClass->load(['major', 'academicYear']));
    // }
    public function update(
    SchoolClassRequest $request,
    SchoolClass $schoolClass
): JsonResponse {
    $data = $request->validated();

    if (array_key_exists('group', $data)) {
        $data['group_name'] = $data['group'];
        unset($data['group']);
    }

    $schoolClass->update($data);

    return (new SchoolClassResource(
        $schoolClass->fresh()->load(['major', 'academicYear'])
    ))->response();
}

    public function destroy(SchoolClass $schoolClass): JsonResponse
    {
        if ($schoolClass->classSubjects()->exists() || $schoolClass->enrollments()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this class still has subject assignments or enrollments.',
            ], 409);
        }

        $schoolClass->delete();

        return response()->json(['success' => true, 'message' => 'Class deleted.']);
    }
}
