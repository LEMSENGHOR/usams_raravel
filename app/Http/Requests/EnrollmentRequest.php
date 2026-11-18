<?php

namespace App\Http\Requests;

use App\Models\Enrollment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EnrollmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * academic_year_id is not accepted: it is derived from the class on the server.
     */
    public function rules(): array
    {
        if ($this->isMethod('POST')) {
            return [
                'student_id' => ['required', 'integer', 'exists:students,id'],
                'class_id' => ['required', 'integer', 'exists:classes,id'],
            ];
        }

        return [
            'status' => ['required', Rule::in([
                Enrollment::STATUS_ACTIVE, Enrollment::STATUS_DROPPED, Enrollment::STATUS_COMPLETED,
            ])],
        ];
    }
}
