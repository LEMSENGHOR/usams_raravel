<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MarkAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // AttendanceSessionPolicy@manage is checked in the controller
    }

    /**
     * PENDING is not a valid target: a record can never be moved back to PENDING.
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])],
            'note' => ['required_if:status,EXCUSED', 'nullable', 'string', 'max:500'],
            'reason' => ['nullable', 'string', 'max:500'],
        ];
    }
}
