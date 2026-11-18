<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Major extends Model
{
    protected $table = 'majors';

    protected $fillable = ['department_id', 'code', 'name'];

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'major_id');
    }

    public function classes(): HasMany
    {
        return $this->hasMany(SchoolClass::class, 'major_id');
    }
}
