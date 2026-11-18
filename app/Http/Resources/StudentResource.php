<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'major_id' => $this->major_id,

            'student_code' => $this->student_code,
            'full_name' => $this->full_name,

            'email' => $this->whenLoaded(
                'user',
                fn () => $this->user?->email
            ),

            'status' => $this->whenLoaded(
                'user',
                fn () => $this->user?->status
            ),

            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->toDateString(),

            'major' => MajorResource::make(
                $this->whenLoaded('major')
            ),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'admission_date' => $this->admission_date?->toDateString(),
//             'enrollments' => $this->whenLoaded(
//     'enrollments',
//     fn () => $this->enrollments->map(fn ($enrollment) => [
//         'id' => $enrollment->id,

//         'class' => [
//             'id' => $enrollment->schoolClass?->id,
//             'code' => $enrollment->schoolClass?->code,
//             'name' => $enrollment->schoolClass?->name,
//         ],

//         'academic_year' => [
//             'id' => $enrollment->academicYear?->id,
//             'name' => $enrollment->academicYear?->name,
//         ],

//         'status' => $enrollment->status,
//     ])->values()
// ),

'enrollments' => $this->whenLoaded(
    'enrollments',
    fn () => $this->enrollments
        ->where('status', 'ACTIVE')
        ->map(fn ($enrollment) => [
            'id' => $enrollment->id,
            'class' => [
                'id' => $enrollment->schoolClass?->id,
                'code' => $enrollment->schoolClass?->code,
                'name' => $enrollment->schoolClass?->name,
            ],
            'academic_year' => [
                'id' => $enrollment->academicYear?->id,
                'name' => $enrollment->academicYear?->name,
            ],
            'status' => $enrollment->status,
        ])
        ->values()
),

'class_codes' => $this->whenLoaded(
    'enrollments',
    fn () => $this->enrollments
        ->where('status', 'ACTIVE')
        // ->pluck('schoolClass.code')
        ->pluck('schoolClass.name')
        ->filter()
        ->unique()
        ->values()
        ->implode(', ')
),

'academic_year_names' => $this->whenLoaded(
    'enrollments',
    fn () => $this->enrollments
        ->where('status', 'ACTIVE')
        ->pluck('academicYear.name')
        ->filter()
        ->unique()
        ->values()
        ->implode(', ')
),
        ];
    }
}
