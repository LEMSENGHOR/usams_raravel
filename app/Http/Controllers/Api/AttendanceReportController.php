<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AttendanceReportRequest;
use App\Services\AttendanceReportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceReportController extends Controller
{
    private const FILTER_KEYS = [
        'date_from', 'date_to', 'class_id', 'subject_id', 'lecturer_id',
        'semester_id', 'student_id', 'class_subject_id',
    ];

    public function __construct(private readonly AttendanceReportService $reports)
    {
    }

    /**
     * GET /api/attendance-reports?group_by=student&date_from=2026-09-01&date_to=2026-12-31
     */
    public function index(AttendanceReportRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $filters = array_intersect_key($data, array_flip(self::FILTER_KEYS));
        $perPage = max(1, min((int) ($data['per_page'] ?? 25), 100));

        $page = $this->reports->grouped($user, $filters, $data['group_by'])->paginate($perPage);

        return response()->json([
            'data' => $page->getCollection()->map(fn ($row) => $this->reports->shape($row))->values(),
            'meta' => [
                'current_page' => $page->currentPage(),
                'per_page' => $page->perPage(),
                'total' => $page->total(),
                'last_page' => $page->lastPage(),
            ],
            'totals' => $this->reports->totals($user, $filters),
            'group_by' => $data['group_by'],
            'filters' => $filters,
            'formula' => AttendanceReportService::formulaDescription(),
        ]);
    }

    /**
     * GET /api/attendance-reports/export?group_by=student  ->  CSV (UTF-8 with BOM so Excel shows Khmer).
     */
    public function export(AttendanceReportRequest $request): StreamedResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $filters = array_intersect_key($data, array_flip(self::FILTER_KEYS));
        $group = $data['group_by'];

        $query = $this->reports->grouped($user, $filters, $group);
        $filename = sprintf('attendance-report-%s-%s.csv', $group, now()->format('Ymd-His'));

        return response()->streamDownload(function () use ($query, $group) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");

            $this->writeRow($out, [
                'group_by', 'code', 'label', 'present', 'absent', 'late',
                'excused', 'pending', 'total', 'attendance_percentage',
            ]);

            foreach ($query->cursor() as $raw) {
                $row = $this->reports->shape($raw);

                $this->writeRow($out, [
                    $group, $row['code'], $row['label'], $row['present'], $row['absent'], $row['late'],
                    $row['excused'], $row['pending'], $row['total'], $row['attendance_percentage'],
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Neutralise CSV/Excel formula injection: a text cell that starts with = + - @ (or tab/CR)
     * would be executed as a formula when the file is opened, so it is prefixed with a quote.
     */
    private function writeRow($out, array $cells): void
    {
        $safe = array_map(function ($cell) {
            if (is_string($cell) && $cell !== '' && in_array($cell[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
                return "'" . $cell;
            }

            return $cell;
        }, $cells);

        fputcsv($out, $safe, ',', '"', '');
    }
}
