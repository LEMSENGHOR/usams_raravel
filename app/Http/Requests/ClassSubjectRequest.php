<?php

namespace App\Http\Requests;

use App\Models\SchoolClass;
use App\Models\Semester;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class ClassSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * On update only the lecturer may change; the class/subject/semester identity is fixed.
     */
    public function rules(): array
    {
        if ($this->isMethod('POST')) {
            return [
                'class_id' => ['required', 'integer', 'exists:classes,id'],
                'subject_id' => ['required', 'integer', 'exists:subjects,id'],
                'lecturer_id' => ['required', 'integer', 'exists:lecturers,id'],
                'semester_id' => ['required', 'integer', 'exists:semesters,id'],
            ];
        }

        return [
            'lecturer_id' => ['required', 'integer', 'exists:lecturers,id'],
            'class_id' => ['prohibited'],
            'subject_id' => ['prohibited'],
            'semester_id' => ['prohibited'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty() || ! $this->isMethod('POST')) {
                return;
            }

            $class = SchoolClass::find($this->input('class_id'));
            $semester = Semester::find($this->input('semester_id'));

            if ($class && $semester && $class->academic_year_id !== $semester->academic_year_id) {
                $validator->errors()->add('semester_id', 'The semester does not belong to the class academic year.');
            }
        }];
    }
}
