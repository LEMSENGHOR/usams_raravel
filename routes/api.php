<?php

use App\Http\Middleware\EnsureUserIsActive;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes Entry Point
|--------------------------------------------------------------------------
*/

// ---- PUBLIC ROUTES ----
Route::prefix('auth')->group(base_path('routes/api/public.php'));

// ---- AUTHENTICATED ROUTES ----
Route::middleware(['auth:sanctum', EnsureUserIsActive::class])->group(function () {
    
    // Core Profile & General Read Endpoints
    Route::group([], base_path('routes/api/authenticated.php'));

    // Staff & Lecturer Gate
    Route::group([], base_path('routes/api/staff.php'));

    // Administrative Gate
    Route::group([], base_path('routes/api/admin.php'));
});
