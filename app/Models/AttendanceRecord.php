<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AttendanceRecord extends Model
{
    public const STATUS_PENDING = 'PENDING';
    public const STATUS_PRESENT = 'PRESENT';
    public const STATUS_ABSENT = 'ABSENT';
    public const STATUS_LATE = 'LATE';
    public const STATUS_EXCUSED = 'EXCUSED';

    public const MARKABLE_STATUSES = [
        self::STATUS_PRESENT, self::STATUS_ABSENT, self::STATUS_LATE, self::STATUS_EXCUSED,
    ];

    protected $table = 'attendance_records';

    // status/marked_by/marked_at are changed only through the attendance service.
    protected $fillable = ['attendance_session_id', 'student_id', 'note'];

    protected function casts(): array
    {
        return ['marked_at' => 'datetime'];
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function markedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marked_by');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AttendanceAuditLog::class, 'attendance_record_id');
    }
}
