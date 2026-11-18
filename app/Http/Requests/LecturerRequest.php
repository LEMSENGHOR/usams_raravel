<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LecturerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    /**
     * Note: "role" is deliberately NOT accepted. The controller always forces LECTURER.
     */
    public function rules(): array
    {
        $lecturer = $this->route('lecturer');
        $presence = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'department_id' => [$presence, 'integer', 'exists:departments,id'],
            'lecturer_code' => [$presence, 'string', 'max:30', Rule::unique('lecturers', 'lecturer_code')->ignore($lecturer?->id)],
            'full_name' => [$presence, 'string', 'max:255'],
            'email' => [$presence, 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($lecturer?->user_id)],
            'academic_title' => [$presence, 'string', 'max:255'],
            'password' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'string', 'min:8', 'max:255'],
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
        ];
    }
}
