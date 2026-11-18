<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceRecordResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'attendance_session_id' => $this->attendance_session_id,
            'student_id' => $this->student_id,
            'status' => $this->status,
            'note' => $this->note,
            'marked_by' => $this->marked_by,
            'marked_at' => $this->marked_at,
            'student' => new StudentResource($this->whenLoaded('student')),
            'session' => new AttendanceSessionResource($this->whenLoaded('session')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
