<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceSessionResource extends JsonResource
{
    private ?array $summary = null;

    public function withSummary(array $summary): static
    {
        $this->summary = $summary;

        return $this;
    }

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'class_subject_id' => $this->class_subject_id,
            'timetable_id' => $this->timetable_id,
            'session_date' => $this->session_date?->toDateString(),
            'start_time' => substr((string) $this->start_time, 0, 5),
            'end_time' => substr((string) $this->end_time, 0, 5),
            'status' => $this->status,
            'opened_at' => $this->opened_at,
            'closed_at' => $this->closed_at,
            'created_by' => $this->created_by,
            'records_count' => $this->whenCounted('records'),
            'summary' => $this->when($this->summary !== null, $this->summary),
            'class_subject' => new ClassSubjectResource($this->whenLoaded('classSubject')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
