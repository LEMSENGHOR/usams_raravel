<?php

use App\Http\Controllers\Api\AttendanceReportController;
use App\Http\Controllers\Api\AttendanceSessionController;
use App\Http\Middleware\EnsureRole;
use Illuminate\Support\Facades\Route;

Route::middleware(EnsureRole::class . ':SUPER_ADMIN,ADMIN,LECTURER')->group(function () {
    
    // ---- ATTENDANCE OPERATIONS ----
    Route::prefix('attendance-sessions')->group(function () {
        Route::get('/', [AttendanceSessionController::class, 'index']);
        Route::post('/', [AttendanceSessionController::class, 'store']);
        Route::get('{session}', [AttendanceSessionController::class, 'show'])->whereNumber('session');
        Route::post('{session}/open', [AttendanceSessionController::class, 'open'])->whereNumber('session');
        Route::post('{session}/initialize', [AttendanceSessionController::class, 'initialize'])->whereNumber('session');
        Route::get('{session}/students', [AttendanceSessionController::class, 'students'])->whereNumber('session');
        Route::post('{session}/close', [AttendanceSessionController::class, 'close'])->whereNumber('session');
        Route::post('{session}/cancel', [AttendanceSessionController::class, 'cancel'])->whereNumber('session');
        Route::get('{session}/audit-logs', [AttendanceSessionController::class, 'auditLogs'])->whereNumber('session');
        
        Route::patch('{session}/records/{record}', [AttendanceSessionController::class, 'mark'])
            ->whereNumber(['session', 'record']);
    });

    // ---- BUSINESS REPORTS ----
    Route::prefix('attendance-reports')->group(function () {
        Route::get('/', [AttendanceReportController::class, 'index']);
        Route::get('export', [AttendanceReportController::class, 'export']);
    });
});
