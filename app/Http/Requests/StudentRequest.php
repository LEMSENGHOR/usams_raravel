<?php
namespace App\Http\Requests;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $student = $this->route('student');
        $isCreating = $this->isMethod('POST');
        $presence = $isCreating ? 'required' : 'sometimes';

        return [
            'major_id' => [
                $presence,
                'integer',
                'exists:majors,id',
            ],

            'student_code' => [
                $presence,
                'string',
                'max:30',
                Rule::unique('students', 'student_code')
                    ->ignore($student?->id),
            ],

            'full_name' => [
                $presence,
                'string',
                'max:255',
            ],

            'gender' => [
                'nullable',
                Rule::in(['MALE', 'FEMALE', 'OTHER']),
            ],

            'date_of_birth' => [
                'nullable',
                'date_format:Y-m-d',
                'before:today',
            ],

            'email' => [
                $presence,
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($student?->user_id),
            ],

            'password' => [
                $isCreating ? 'required' : 'sometimes',
                'string',
                'min:8',
                'max:255',
            ],

            'admission_date' => [
                $presence,
                'date_format:Y-m-d',
            ],

            'status' => [
                'sometimes',
                Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
            ],
        ];
    }
}

// namespace App\Http\Requests;
// use Illuminate\Foundation\Http\FormRequest;
// use Illuminate\Validation\Rule;

// class StudentRequest extends FormRequest
// {
//     public function authorize(): bool
//     {
//         return $this->user()?->isAdmin() ?? false;
//     }
//     public function rules(): array
//     {
//         $student = $this->route('student');
//         $presence = $this->isMethod('POST') ? 'required' : 'sometimes';
//         return [
//             'major_id' => [$presence, 'integer', 'exists:majors,id'],
//             'student_code' => [$presence, 'string', 'max:30', Rule::unique('students', 'student_code')->ignore($student?->id)],
//             'full_name' => [$presence, 'string', 'max:255'],
//             'gender' => ['nullable', Rule::in(['MALE', 'FEMALE', 'OTHER'])],
//             'date_of_birth' => ['nullable', 'date_format:Y-m-d', 'before:today'],
//             'email' => [$presence, 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($student?->user_id)],
//             'password' => [$this->isMethod('POST') ? 'required' : 'sometimes', 'string', 'min:8', 'max:255'],
//             'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED'])],
//         ];
//     }
// }
