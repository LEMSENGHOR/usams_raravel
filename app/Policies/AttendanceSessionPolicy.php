<?php

namespace App\Policies;

use App\Models\AttendanceSession;
use App\Models\ClassSubject;
use App\Models\User;

/**
 * Who may touch an attendance session:
 *  - SUPER_ADMIN / ADMIN: every session.
 *  - LECTURER: only sessions of class-subjects assigned to them.
 *  - STUDENT: never (students read their own history via /students/{student}/attendance).
 */
class AttendanceSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() || $user->hasRole(User::ROLE_LECTURER);
    }

    public function view(User $user, AttendanceSession $session): bool
    {
        return $this->canAccess($user, $session->classSubject);
    }

    /** Called as Gate::authorize('create', [AttendanceSession::class, $classSubject]) */
    public function create(User $user, ClassSubject $classSubject): bool
    {
        return $this->canAccess($user, $classSubject);
    }

    /** open / initialize / mark / close / cancel */
    public function manage(User $user, AttendanceSession $session): bool
    {
        return $this->canAccess($user, $session->classSubject);
    }

    public function viewAuditLogs(User $user, AttendanceSession $session): bool
    {
        return $this->canAccess($user, $session->classSubject);
    }

    private function canAccess(User $user, ClassSubject $classSubject): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if (! $user->hasRole(User::ROLE_LECTURER)) {
            return false;
        }

        $lecturerId = $user->lecturer?->id;

        return $lecturerId !== null && (int) $lecturerId === (int) $classSubject->lecturer_id;
    }
}
