<?php

namespace App\Http\Requests;

use App\Models\ClassSubject;
use App\Models\Timetable;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class TimetableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        $presence = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'class_subject_id' => [$presence, 'integer', 'exists:class_subjects,id'],
            'day_of_week' => [$presence, 'integer', 'between:1,7'],
            'start_time' => [$presence, 'date_format:H:i'],
            'end_time' => [$presence, 'date_format:H:i'],
            'room' => ['nullable', 'string', 'max:50'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator) {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $timetable = $this->route('timetable');
            $csId = $this->input('class_subject_id', $timetable?->class_subject_id);
            $day = $this->input('day_of_week', $timetable?->day_of_week);
            $start = $this->input('start_time', $timetable ? substr((string) $timetable->start_time, 0, 5) : null);
            $end = $this->input('end_time', $timetable ? substr((string) $timetable->end_time, 0, 5) : null);

            if ($end <= $start) {
                $validator->errors()->add('end_time', 'end_time must be after start_time.');
                return;
            }

            $classSubject = ClassSubject::find($csId);
            if (! $classSubject) {
                return;
            }

            // Reject overlap with another timetable of the same class OR the same lecturer.
            $conflict = Timetable::query()
                ->where('day_of_week', $day)
                ->where('start_time', '<', $end)
                ->where('end_time', '>', $start)
                ->when($timetable, fn ($q) => $q->where('id', '!=', $timetable->id))
                ->whereHas('classSubject', fn ($q) => $q->where(fn ($w) => $w
                    ->where('class_id', $classSubject->class_id)
                    ->orWhere('lecturer_id', $classSubject->lecturer_id)))
                ->exists();

            if ($conflict) {
                $validator->errors()->add('start_time', 'Schedule conflicts with another timetable of the same class or lecturer.');
            }
        }];
    }
}
