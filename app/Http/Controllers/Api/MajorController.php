<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MajorRequest;
use App\Http\Resources\MajorResource;
use App\Models\Major;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MajorController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));
        $search = trim((string) $request->query('q', ''));

        $majors = Major::query()
            ->with('department')
            ->when($request->filled('department_id'), fn ($q) => $q->where('department_id', $request->integer('department_id')))
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%")))
            ->orderBy('code')
            ->paginate($perPage)
            ->withQueryString();

        return MajorResource::collection($majors);
    }

    public function show(Major $major): MajorResource
    {
        return new MajorResource($major->load('department.faculty'));
    }

    public function store(MajorRequest $request): JsonResponse
    {
        $major = Major::create($request->validated());

        return (new MajorResource($major->load('department')))->response()->setStatusCode(201);
    }

    public function update(MajorRequest $request, Major $major): MajorResource
    {
        $major->update($request->validated());

        return new MajorResource($major->load('department'));
    }

    public function destroy(Major $major): JsonResponse
    {
        if ($major->students()->exists() || $major->classes()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this major still has students or classes.',
            ], 409);
        }

        $major->delete();

        return response()->json(['success' => true, 'message' => 'Major deleted.']);
    }
}
