<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class DepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('department')?->id;
        $presence = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'faculty_id' => [$presence, 'integer', 'exists:faculties,id'],
            'code' => [$presence, 'string', 'max:20', Rule::unique('departments', 'code')->ignore($id)],
            'name' => [$presence, 'string', 'max:255'],
        ];
    }
}
