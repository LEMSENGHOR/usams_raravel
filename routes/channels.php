
<?php

use App\Models\AttendanceSession;
use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

// Private channel for the authenticated user's own data.
Broadcast::channel('App.Models.User.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for real-time attendance updates.
Broadcast::channel('attendance.session.{sessionId}', function (
    User $user,
    int $sessionId
) {
    // Only authorized staff can subscribe.
    if (!$user->hasRole(
        User::ROLE_SUPER_ADMIN,
        User::ROLE_ADMIN,
        User::ROLE_LECTURER
    )) {
        return false;
    }

    // Reuse the existing visibility rules.
    return AttendanceSession::query()
        ->visibleTo($user)
        ->whereKey($sessionId)
        ->exists();
});
