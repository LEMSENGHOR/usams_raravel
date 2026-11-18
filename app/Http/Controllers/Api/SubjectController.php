<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SubjectRequest;
use App\Http\Resources\SubjectResource;
use App\Models\Subject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));
        $search = trim((string) $request->query('q', ''));

        $subjects = Subject::query()
            ->with('department')
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%")))
            ->orderBy('code')
            ->paginate($perPage)
            ->withQueryString();

        return SubjectResource::collection($subjects);
    }

    public function show(Subject $subject): SubjectResource
    {
        return new SubjectResource($subject->load('department'));
    }

    public function store(SubjectRequest $request): JsonResponse
    {
        $subject = Subject::create($request->validated());

        return (new SubjectResource($subject->load('department')))->response()->setStatusCode(201);
    }

    public function update(SubjectRequest $request, Subject $subject): SubjectResource
    {
        $subject->update($request->validated());

        return new SubjectResource($subject->load('department'));
    }

    public function destroy(Subject $subject): JsonResponse
    {
        if ($subject->classSubjects()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this subject is assigned to a class.',
            ], 409);
        }

        $subject->delete();

        return response()->json(['success' => true, 'message' => 'Subject deleted.']);
    }
}
