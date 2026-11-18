<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LecturerResource extends JsonResource
{
        public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'department_id' => $this->department_id,
            'lecturer_code' => $this->lecturer_code,
            'full_name' => $this->full_name,
            'academic_title' => $this->academic_title,
            'name' => $this->full_name, // Added for frontend compatibility
            'email' => $this->whenLoaded('user', fn () => $this->user->email), // Added
            'status' => $this->whenLoaded('user', fn () => $this->user->status), // Added
            'account' => $this->whenLoaded('user', fn () => [
                'email' => $this->user->email,
                'role' => $this->user->role,
                'status' => $this->user->status,
            ]),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    // public function toArray(Request $request): array
    // {
    //     return [
    //         'id' => $this->id,
    //         'user_id' => $this->user_id,
    //         'department_id' => $this->department_id,
    //         'lecturer_code' => $this->lecturer_code,
    //         'full_name' => $this->full_name,
    //         'account' => $this->whenLoaded('user', fn () => [
    //             'email' => $this->user->email,
    //             'role' => $this->user->role,
    //             'status' => $this->user->status,
    //         ]),
    //         'department' => new DepartmentResource($this->whenLoaded('department')),
    //         'created_at' => $this->created_at,
    //         'updated_at' => $this->updated_at,
    //     ];
    // }
}
