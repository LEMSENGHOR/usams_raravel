<?php

namespace App\Models;
use App\Models\Concerns\VisibleTo;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    use VisibleTo;
    public const STATUS_ACTIVE = 'ACTIVE';

    protected $table = 'enrollments';

    protected $fillable = ['student_id', 'class_id', 'academic_year_id', 'status'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }
}
