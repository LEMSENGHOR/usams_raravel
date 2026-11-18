<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // ownership is checked by AttendanceSessionPolicy@create in the controller
    }

    public function rules(): array
    {
        return [
            'class_subject_id' => ['required', 'integer', 'exists:class_subjects,id'],
            'timetable_id' => ['nullable', 'integer', 'exists:timetables,id'],
            'session_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isEmpty() && $this->input('end_time') <= $this->input('start_time')) {
                $validator->errors()->add('end_time', 'end_time must be after start_time.');
            }
        }];
    }
}
