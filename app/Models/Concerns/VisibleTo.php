<?php

namespace App\Models\Concerns;

use App\Models\Enrollment;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

trait VisibleTo
{
    public function scopeVisibleTo(Builder $query, ?User $user): Builder
    {
        // No authenticated user: return no records.
        if (!$user) {
            return $query->whereRaw('1 = 0');
        }

        // Administrators can access all records.
        if ($user->hasRole(
            User::ROLE_SUPER_ADMIN,
            User::ROLE_ADMIN
        )) {
            return $query;
        }

        // Resolve the related profile belonging to this user.
        if ($user->hasRole(User::ROLE_LECTURER)) {
            $lecturerId = $user->lecturer()->value('id');

            if (!$lecturerId) {
                return $query->whereRaw('1 = 0');
            }

            return $this->applyLecturerVisibility($query, $lecturerId);
        }

        if ($user->hasRole(User::ROLE_STUDENT)) {
            $studentId = $user->student()->value('id');

            if (!$studentId) {
                return $query->whereRaw('1 = 0');
            }

            return $this->applyStudentVisibility($query, $studentId);
        }

        // Unknown roles cannot access these records.
        return $query->whereRaw('1 = 0');
    }

    private function applyLecturerVisibility(
        Builder $query,
        int $lecturerId
    ): Builder {
        $model = $query->getModel();

        // ClassSubject: only assignments belonging to this lecturer.
        if ($model instanceof \App\Models\ClassSubject) {
            return $query->where('lecturer_id', $lecturerId);
        }

        // Enrollment: only enrollments in classes assigned to this lecturer.
        if ($model instanceof Enrollment) {
            return $query->whereHas(
                'schoolClass.classSubjects',
                fn (Builder $q) => $q->where('lecturer_id', $lecturerId)
            );
        }

        // Timetable and AttendanceSession:
        // only records belonging to this lecturer's assignments.
        return $query->whereHas(
            'classSubject',
            fn (Builder $q) => $q->where('lecturer_id', $lecturerId)
        );
    }

    private function applyStudentVisibility(
        Builder $query,
        int $studentId
    ): Builder {
        $model = $query->getModel();

        // Enrollment: only this student's active enrollments.
        if ($model instanceof Enrollment) {
            return $query
                ->where('student_id', $studentId)
                ->where('status', Enrollment::STATUS_ACTIVE);
        }

        // ClassSubject: only assignments in classes where
        // this student has an active enrollment.
        if ($model instanceof \App\Models\ClassSubject) {
            return $query->whereHas(
                'schoolClass.enrollments',
                fn (Builder $q) => $q
                    ->where('student_id', $studentId)
                    ->where('status', Enrollment::STATUS_ACTIVE)
            );
        }

        // Timetable and AttendanceSession:
        // only records belonging to an actively enrolled class.
        return $query->whereHas(
            'classSubject.schoolClass.enrollments',
            fn (Builder $q) => $q
                ->where('student_id', $studentId)
                ->where('status', Enrollment::STATUS_ACTIVE)
        );
    }
}
