<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MajorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('major')?->id;
        $presence = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'department_id' => [$presence, 'integer', 'exists:departments,id'],
            'code' => [$presence, 'string', 'max:20', Rule::unique('majors', 'code')->ignore($id)],
            'name' => [$presence, 'string', 'max:255'],
        ];
    }
}
