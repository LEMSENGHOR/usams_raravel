
<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\ClassSubjectController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\FacultyController;
use App\Http\Controllers\Api\LecturerController;
use App\Http\Controllers\Api\MajorController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AttendanceSessionController;

use App\Http\Middleware\EnsureRole;
use Illuminate\Support\Facades\Route;

// AUTHENTICATED ADMIN ROUTES
Route::middleware(['auth:sanctum', EnsureRole::class . ':SUPER_ADMIN,ADMIN'])
    ->group(function () {

        // Middleware Check
        Route::get('admin/ping', fn () => response()->json([
            'success' => true,
            'message' => 'pong',
        ]));

        // USER MANAGEMENT
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);

        // HUMAN RESOURCES MANAGEMENT
        Route::apiResource('students', StudentController::class);
        Route::apiResource('lecturers', LecturerController::class);

        // DATA MUTATIONS & OVERRIDES
        Route::apiResource('faculties', FacultyController::class)
            ->except(['index', 'show']);

        Route::apiResource('departments', DepartmentController::class)
            ->except(['index', 'show']);

        Route::apiResource('majors', MajorController::class)
            ->except(['index', 'show']);

        Route::apiResource('semesters', SemesterController::class)
            ->except(['index', 'show']);

        Route::apiResource('subjects', SubjectController::class)
            ->except(['index', 'show']);

        Route::apiResource('enrollments', EnrollmentController::class)
            ->except(['index', 'show']);

        Route::apiResource('timetables', TimetableController::class)
            ->except(['index', 'show']);

        Route::apiResource('academic-years', AcademicYearController::class)
            ->parameters(['academic-years' => 'academic_year'])
            ->except(['index', 'show']);

        Route::apiResource('classes', SchoolClassController::class)
            ->parameters(['classes' => 'school_class'])
            ->except(['index', 'show']);

        Route::apiResource('class-subjects', ClassSubjectController::class)
            ->parameters(['class-subjects' => 'class_subject'])
            ->except(['index', 'show']);

        Route::get('/attendance-records', [
    AttendanceSessionController::class,
    'records',
]);
    });
