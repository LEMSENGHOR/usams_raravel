<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassSubjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'class_id' => $this->class_id,
            'subject_id' => $this->subject_id,
            'lecturer_id' => $this->lecturer_id,
            'semester_id' => $this->semester_id,
            'class' => new SchoolClassResource($this->whenLoaded('schoolClass')),
            'subject' => new SubjectResource($this->whenLoaded('subject')),
            'lecturer' => new LecturerResource($this->whenLoaded('lecturer')),
            'semester' => new SemesterResource($this->whenLoaded('semester')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
