<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
class UserResource extends JsonResource
{
    /**
     * Transform user data into a standard JSON structure.
     * Never expose password, remember_token, or authentication tokens here.
     */
    public function toArray(Request $request): array
    {
        $profile = null;
        

        if ($this->role === 'STUDENT' && $this->relationLoaded('student')) {
            $student = $this->student;

            $profile = $student ? [
                'student_code' => $student->student_code,
                'full_name' => $student->full_name,
                'major_id' => $student->major_id,
            ] : null;
        }

        if ($this->role === 'LECTURER' && $this->relationLoaded('lecturer')) {
            $lecturer = $this->lecturer;

            $profile = $lecturer ? [
                'lecturer_code' => $lecturer->lecturer_code,
                'full_name' => $lecturer->full_name,
                'department_id' => $lecturer->department_id,
            ] : null;
        }

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            // 'avatar' => $this->avatar ?? null,
            'avatar' => $this->avatar ? Storage::url($this->avatar) : null,
    //         'avatar' => $this->avatar
    // ? asset(Storage::disk('public')->url($this->avatar))
    // : null,
            'role' => $this->role,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'profile' => $profile,
        ];
    }
}
