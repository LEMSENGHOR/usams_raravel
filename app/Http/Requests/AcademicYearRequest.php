<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('academic_year')?->id;
        $presence = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'name' => [$presence, 'string', 'max:20', Rule::unique('academic_years', 'name')->ignore($id)],
            'start_date' => [$presence, 'date_format:Y-m-d'],
            'end_date' => [$presence, 'date_format:Y-m-d'],
            'is_current' => ['sometimes', 'boolean'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $existing = $this->route('academic_year');
            $start = $this->input('start_date', $existing?->start_date?->toDateString());
            $end = $this->input('end_date', $existing?->end_date?->toDateString());

            if ($start && $end && $end <= $start) {
                $validator->errors()->add('end_date', 'end_date must be after start_date.');
            }
        }];
    }
}
