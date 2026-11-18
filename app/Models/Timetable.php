<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Concerns\VisibleTo;

class Timetable extends Model
{
    protected $table = 'timetables';
use VisibleTo;
    protected $fillable = ['class_subject_id', 'day_of_week', 'start_time', 'end_time', 'room'];

    protected function casts(): array
    {
        return ['day_of_week' => 'integer'];
    }

    public function classSubject(): BelongsTo
    {
        return $this->belongsTo(ClassSubject::class, 'class_subject_id');
    }

    public function attendanceSessions(): HasMany
    {
        return $this->hasMany(AttendanceSession::class, 'timetable_id');
    }
}
