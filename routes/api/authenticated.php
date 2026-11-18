<?php

use App\Http\Controllers\Api\AcademicYearController;
use App\Http\Controllers\Api\ClassSubjectController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\FacultyController;
use App\Http\Controllers\Api\MajorController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SchoolClassController;
use App\Http\Controllers\Api\SemesterController;
use App\Http\Controllers\Api\StudentAttendanceController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TimetableController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// ---- IDENTITY Management ----
Route::post('auth/logout', [AuthController::class, 'logout']);
Route::get('auth/me', [AuthController::class, 'me']);

// ---- USER PROFILE ----
Route::get('profile', [ProfileController::class, 'show']);
Route::match(['put', 'patch'], 'profile', [ProfileController::class, 'update']);
Route::post('profile/avatar', [ProfileController::class, 'updateAvatar']);
Route::delete('profile/avatar', [ProfileController::class, 'deleteAvatar']);

// ---- GLOBAL DIRECTORY READS ----
Route::apiResource('faculties', FacultyController::class)->only(['index', 'show']);
Route::apiResource('departments', DepartmentController::class)->only(['index', 'show']);
Route::apiResource('majors', MajorController::class)->only(['index', 'show']);
Route::apiResource('semesters', SemesterController::class)->only(['index', 'show']);
Route::apiResource('subjects', SubjectController::class)->only(['index', 'show']);

Route::apiResource('academic-years', AcademicYearController::class)
    ->parameters(['academic-years' => 'academic_year'])
    ->only(['index', 'show']);

Route::apiResource('classes', SchoolClassController::class)
    ->parameters(['classes' => 'school_class'])
    ->only(['index', 'show']);

// ---- SCOPED RECORDS ----
Route::apiResource('enrollments', EnrollmentController::class)->only(['index', 'show']);
Route::apiResource('timetables', TimetableController::class)->only(['index', 'show']);

Route::apiResource('class-subjects', ClassSubjectController::class)
    ->parameters(['class-subjects' => 'class_subject'])
    ->only(['index', 'show']);

// ---- PERSONAL ATTENDANCE HISTORY ----
Route::get('students/{student}/attendance', [StudentAttendanceController::class, 'index'])
    ->whereNumber('student');
