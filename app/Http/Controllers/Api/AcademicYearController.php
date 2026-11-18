<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AcademicYearRequest;
use App\Http\Resources\AcademicYearResource;
use App\Models\AcademicYear;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AcademicYearController extends Controller
{
    public function index(Request $request)
    {
        $perPage = max(1, min($request->integer('per_page', 15), 100));
        $search = trim((string) $request->query('q', ''));

        $years = AcademicYear::query()
            ->when($request->has('is_current'), fn ($q) => $q->where('is_current', $request->boolean('is_current')))
            ->when($search !== '', fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->orderByDesc('start_date')
            ->paginate($perPage)
            ->withQueryString();

        return AcademicYearResource::collection($years);
    }

    public function show(AcademicYear $academicYear): AcademicYearResource
    {
        return new AcademicYearResource($academicYear->loadCount('semesters'));
    }

    public function store(AcademicYearRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Only one academic year may be current: flip the others off in the same transaction.
        $year = DB::transaction(function () use ($data) {
            if (! empty($data['is_current'])) {
                AcademicYear::where('is_current', true)->update(['is_current' => false]);
            }

            return AcademicYear::create($data);
        });

        return (new AcademicYearResource($year))->response()->setStatusCode(201);
    }

    public function update(AcademicYearRequest $request, AcademicYear $academicYear): AcademicYearResource
    {
        $data = $request->validated();

        DB::transaction(function () use ($data, $academicYear) {
            if (! empty($data['is_current'])) {
                AcademicYear::where('is_current', true)
                    ->where('id', '!=', $academicYear->id)
                    ->update(['is_current' => false]);
            }

            $academicYear->update($data);
        });

        return new AcademicYearResource($academicYear->fresh());
    }

    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        if ($academicYear->semesters()->exists()
            || $academicYear->classes()->exists()
            || $academicYear->enrollments()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete: this academic year is still referenced.',
            ], 409);
        }

        $academicYear->delete();

        return response()->json(['success' => true, 'message' => 'Academic year deleted.']);
    }
}
