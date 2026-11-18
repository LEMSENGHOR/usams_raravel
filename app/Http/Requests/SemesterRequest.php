<?php

namespace App\Http\Requests;

use App\Models\AcademicYear;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SemesterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $semester = $this->route('semester');
        $presence = $this->isMethod('POST') ? 'required' : 'sometimes';
        $yearId = $this->input('academic_year_id', $semester?->academic_year_id);

        return [
            'academic_year_id' => [$presence, 'integer', 'exists:academic_years,id'],
            'name' => [
                $presence, 'string', 'max:50',
                Rule::unique('semesters', 'name')
                    ->where('academic_year_id', $yearId)
                    ->ignore($semester?->id),
            ],
            'start_date' => [$presence, 'date_format:Y-m-d'],
            'end_date' => [$presence, 'date_format:Y-m-d'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $semester = $this->route('semester');
            $yearId = $this->input('academic_year_id', $semester?->academic_year_id);
            $start = $this->input('start_date', $semester?->start_date?->toDateString());
            $end = $this->input('end_date', $semester?->end_date?->toDateString());

            if ($start && $end && $end <= $start) {
                $validator->errors()->add('end_date', 'end_date must be after start_date.');
                return;
            }

            $year = AcademicYear::find($yearId);
            if ($year && $start && $end
                && ($start < $year->start_date->toDateString() || $end > $year->end_date->toDateString())) {
                $validator->errors()->add('start_date', 'Semester dates must be within the academic year.');
            }
        }];
    }
}
