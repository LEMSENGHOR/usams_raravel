<?php

/*
 * USAMS Blade front end: page routes only. This file is loaded from routes/web.php with ONE line:
 *     require __DIR__.'/usams.php';
 * It defines GET page routes and a language switch. It does not touch routes/api.php, middleware classes,
 * auth config or the database. Remove the default "welcome" route from routes/web.php if it exists,
 * otherwise it keeps the "/" address.
 */

use App\Http\Controllers\Web\PageController;
use Illuminate\Support\Facades\Route;

// The page language comes from PageController::middleware(), so these routes need no extra middleware.

Route::redirect('/', '/login');
Route::get('login', [PageController::class, 'login'])->name('usams.login');
Route::get('forbidden', [PageController::class, 'forbidden'])->name('usams.forbidden');

// Language switch: store the choice in a cookie and go back to the page the user was on.
Route::get('locale/{lang}', function (string $lang) {
    abort_unless(in_array($lang, ['en', 'km'], true), 404);

    return back()->withCookie(cookie('usams_locale', $lang, 60 * 24 * 365));
})->name('usams.locale');

// ---- Admin ----
Route::prefix('admin')->name('usams.admin.')->group(function () {
    Route::redirect('/', '/admin/dashboard');
    Route::get('dashboard', [PageController::class, 'adminDashboard'])->name('dashboard');
    Route::get('timetables', [PageController::class, 'adminTimetable'])->name('timetables');
    Route::get('reports', [PageController::class, 'adminReports'])->name('reports');
    Route::get('attendance/sessions/{id}', [PageController::class, 'adminSession'])
        ->where('id', '[A-Za-z0-9\-]+')->name('attendance.session');

    foreach (array_keys(PageController::ADMIN_RESOURCES) as $slug) {
        Route::get($slug, [PageController::class, 'adminResource'])
            ->defaults('slug', $slug)
            ->name('resource.'.str_replace('/', '.', $slug));
    }
});

// ---- Lecturer ----
Route::prefix('lecturer')->name('usams.lecturer.')->group(function () {
    Route::redirect('/', '/lecturer/dashboard');
    Route::get('dashboard', [PageController::class, 'lecturerDashboard'])->name('dashboard');
    Route::get('timetable', [PageController::class, 'lecturerTimetable'])->name('timetable');
    Route::get('attendance/sessions', [PageController::class, 'lecturerSessions'])->name('attendance.sessions');
    Route::get('attendance/sessions/{id}', [PageController::class, 'lecturerSession'])
        ->where('id', '[A-Za-z0-9\-]+')->name('attendance.session');
    Route::get('reports', [PageController::class, 'lecturerReports'])->name('reports');
    Route::get('profile', [PageController::class, 'lecturerProfile'])->name('profile');
    Route::get('classes/{id}', [PageController::class, 'lecturerClass'])
        ->where('id', '[A-Za-z0-9\-]+')->name('class');

    foreach (array_keys(PageController::LECTURER_RESOURCES) as $slug) {
        Route::get($slug, [PageController::class, 'lecturerResource'])
            ->defaults('slug', $slug)
            ->name('resource.'.str_replace('/', '.', $slug));
    }
});

