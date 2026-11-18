<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FacultyRequest;
use App\Http\Resources\FacultyResource;
use App\Models\Faculty;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FacultyController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));
        $search = trim((string) $request->query('q', ''));

        $faculties = Faculty::query()
            ->when($search !== '', fn ($q) => $q->where(fn ($w) => $w
                ->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%")))
            ->orderBy('code')
            ->paginate($perPage)
            ->withQueryString();

        return FacultyResource::collection($faculties);
    }

    public function show(Faculty $faculty): FacultyResource
    {
        return new FacultyResource($faculty->loadCount('departments'));
    }

    public function store(FacultyRequest $request): JsonResponse
    {
        $faculty = Faculty::create($request->validated());

        return (new FacultyResource($faculty))->response()->setStatusCode(201);
    }

    public function update(FacultyRequest $request, Faculty $faculty): FacultyResource
    {
        $faculty->update($request->validated());

        return new FacultyResource($faculty);
    }

    public function destroy(Faculty $faculty): JsonResponse
    {
        if ($faculty->departments()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this faculty still has departments.',
            ], 409);
        }

        $faculty->delete();

        return response()->json(['success' => true, 'message' => 'Faculty deleted.']);
    }
}
