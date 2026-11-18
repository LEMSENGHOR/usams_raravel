<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use LogicException;

class AttendanceAuditLog extends Model
{
    protected $table = 'attendance_audit_logs';

    // The table has only created_at (no updated_at).
    public $timestamps = false;

    protected $fillable = [
        'attendance_record_id', 'attendance_session_id', 'actor_id',
        'old_status', 'new_status', 'reason',
    ];

    protected function casts(): array
    {
        return ['created_at' => 'datetime'];
    }

    // Audit logs are append-only: block updates and deletes at the model level.
    protected static function booted(): void
    {
        static::updating(fn () => throw new LogicException('Audit logs cannot be modified.'));
        static::deleting(fn () => throw new LogicException('Audit logs cannot be deleted.'));
    }

    public function record(): BelongsTo
    {
        return $this->belongsTo(AttendanceRecord::class, 'attendance_record_id');
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
