<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::latest()->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Users retrieved successfully.',
            'data' => $users,
        ]);
    }

    public function store(Request $request)
{
    $validated = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => [
            'required',
            'email',
            'max:255',
            'unique:users,email',
        ],
        'password' => ['required', 'string', 'min:8'],
        // 'role' => ['required', Rule::in(['SUPER_ADMIN', 'LECTURER'])],
        'role' => [
    'required',
            Rule::in(['SUPER_ADMIN', 'ADMIN', 'LECTURER', 'STUDENT']),
        ],
        'status' => [
            'required',
            Rule::in(['ACTIVE', 'INACTIVE', 'SUSPENDED']),
        ],
            ]);

    $user = User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => $validated['role'],
        // 'status' => 'ACTIVE',
        'status' => $validated['status'],
    ]);

    return response()->json([
        'success' => true,
        'message' => 'User created successfully.',
        'data' => $user,
    ], 201);
}
}