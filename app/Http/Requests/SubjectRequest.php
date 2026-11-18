<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('subject')?->id;
        $presence = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'department_id' => [$presence, 'integer', 'exists:departments,id'],
            'code' => [$presence, 'string', 'max:20', Rule::unique('subjects', 'code')->ignore($id)],
            'name' => [$presence, 'string', 'max:255'],
            'credits' => ['sometimes', 'integer', 'between:1,10'],
        ];
    }
}
