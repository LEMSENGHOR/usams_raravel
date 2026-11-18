<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

/**
 * Thrown when an attendance action is not allowed in the current state
 * (e.g. marking a CLOSED session). Always rendered as HTTP 409 JSON.
 */
class AttendanceConflictException extends Exception
{
    public function render(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $this->getMessage(),
        ], 409);
    }
}
