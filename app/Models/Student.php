<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Student extends Model
{
    protected $table = 'students';

    // protected $fillable = [
    //     'user_id', 'major_id', 'student_code', 'full_name', 'gender', 'date_of_birth',
    // ];
    protected $fillable = [
    'user_id',
    'major_id',
    'student_code',
    'full_name',
    'gender',
    'date_of_birth',
    'admission_date',
];

    protected function casts(): array
    {
        return ['date_of_birth' => 'date', 'admission_date' => 'date'];
        
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function major(): BelongsTo
    {
        return $this->belongsTo(Major::class, 'major_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class, 'student_id');
    }

    // Many-to-many through the enrollments pivot table
    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(SchoolClass::class, 'enrollments', 'student_id', 'class_id')
            ->withPivot(['academic_year_id', 'status'])
            ->withTimestamps();
    }

    public function attendanceRecords(): HasMany
    {
        return $this->hasMany(AttendanceRecord::class, 'student_id');
    }
}
