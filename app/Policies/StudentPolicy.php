<?php

namespace App\Policies;

use App\Models\Student;
use App\Models\User;

class StudentPolicy
{
    /**
     * Admins: any student. Student: only themselves.
     * Lecturers pass here but the controller narrows the data to their own sessions.
     */
    public function viewAttendance(User $user, Student $student): bool
    {
        if ($user->isAdmin() || $user->hasRole(User::ROLE_LECTURER)) {
            return true;
        }

        return $user->hasRole(User::ROLE_STUDENT) && (int) $student->user_id === (int) $user->id;
    }
}
