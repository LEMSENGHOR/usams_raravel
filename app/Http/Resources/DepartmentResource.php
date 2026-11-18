<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'faculty_id' => $this->faculty_id,
            'code' => $this->code,
            'name' => $this->name,
            'faculty' => new FacultyResource($this->whenLoaded('faculty')),
            'majors_count' => $this->whenCounted('majors'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
