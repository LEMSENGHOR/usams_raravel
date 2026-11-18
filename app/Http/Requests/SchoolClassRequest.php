<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SchoolClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

//     public function rules(): array
//     {
//         $class = $this->route('school_class');
//         $presence = $this->isMethod('POST') ? 'required' : 'sometimes';
//         $majorId = $this->input('major_id', $class?->major_id);
//         $yearId = $this->input('academic_year_id', $class?->academic_year_id);

//         return [
//             'major_id' => [$presence, 'integer', 'exists:majors,id'],
//             'academic_year_id' => [$presence, 'integer', 'exists:academic_years,id'],
//             'code' => [
//                 $presence, 'string', 'max:30',
//                 Rule::unique('classes', 'code')
//                     ->where('major_id', $majorId)
//                     ->where('academic_year_id', $yearId)
//                     ->ignore($class?->id),
//             ],
//             'name' => [$presence, 'string', 'max:255'],
//             'year_level' => ['required', 'integer', 'between:1,4'],
// 'group' => ['required', 'string', 'max:20'],
// 'status' => ['required', 'in:ACTIVE,INACTIVE'],
//         ];
//     }


public function rules(): array
{
    $class = $this->route('school_class');
    $presence = $this->isMethod('POST') ? 'required' : 'sometimes';

    $majorId = $this->input('major_id', $class?->major_id);
    $yearId = $this->input('academic_year_id', $class?->academic_year_id);

    return [
        'major_id' => [$presence, 'integer', 'exists:majors,id'],
        'academic_year_id' => [$presence, 'integer', 'exists:academic_years,id'],

        'code' => [
            $presence,
            'string',
            'max:30',
            Rule::unique('classes', 'code')
                ->where('major_id', $majorId)
                ->where('academic_year_id', $yearId)
                ->ignore($class?->id),
        ],

        'name' => [$presence, 'string', 'max:255'],

        'year_level' => [$presence, 'integer', 'between:1,4'],
        'group' => [$presence, 'string', 'max:20'],
        'status' => [$presence, 'in:ACTIVE,INACTIVE'],
    ];
}

}
