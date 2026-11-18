<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SchoolClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'major_id' => $this->major_id,
            'academic_year_id' => $this->academic_year_id,
            'code' => $this->code,
            'name' => $this->name,
            // 'major' => new MajorResource($this->whenLoaded('major')),
            // 'academic_year' => new AcademicYearResource($this->whenLoaded('academicYear')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'year_level' => $this->year_level,
            'group' => $this->group_name,
            'status' => $this->status,
            'major' => MajorResource::make(
    $this->whenLoaded('major')
),

'academic_year' => AcademicYearResource::make(
    $this->whenLoaded('academicYear')
),
        ];
    }
}
