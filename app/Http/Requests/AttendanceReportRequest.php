<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Services\AttendanceReportService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttendanceReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        // Students use /students/{student}/attendance instead of reports.
        return $user !== null && ($user->isAdmin() || $user->hasRole(User::ROLE_LECTURER));
    }

    public function rules(): array
    {
        $dateTo = ['nullable', 'date_format:Y-m-d'];
        if ($this->filled('date_from')) {
            $dateTo[] = 'after_or_equal:date_from';
        }

        return [
            'group_by' => ['required', Rule::in(AttendanceReportService::GROUPS)],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => $dateTo,
            'class_id' => ['nullable', 'integer', 'min:1'],
            'subject_id' => ['nullable', 'integer', 'min:1'],
            'lecturer_id' => ['nullable', 'integer', 'min:1'],
            'semester_id' => ['nullable', 'integer', 'min:1'],
            'student_id' => ['nullable', 'integer', 'min:1'],
            'class_subject_id' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
