<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FacultyRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Defense in depth: the route middleware also restricts writes to admins.
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $id = $this->route('faculty')?->id;
        $presence = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'code' => [$presence, 'string', 'max:20', Rule::unique('faculties', 'code')->ignore($id)],
            'name' => [$presence, 'string', 'max:255'],
        ];
    }
}
