<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    // GET /api/profile
    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load([
            'student',
            'lecturer',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile retrieved successfully.',
            'data' => new UserResource($user),
        ]);
    }

    // PUT / PATCH /api/profile
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
        ]);

        $user->fill($validated);
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => new UserResource(
                $user->fresh()->load(['student', 'lecturer'])
            ),
        ]);
    }

    // POST /api/profile/avatar
    // Upload or replace avatar
    public function updateAvatar(Request $request): JsonResponse
    {
        // DEBUG: Check incoming request
        if (config('app.debug')) {
            logger()->debug('Avatar upload request', [
                'content_type' => $request->header('Content-Type'),
                'has_file' => $request->hasFile('avatar'),
                'file_name' => $request->file('avatar')?->getClientOriginalName(),
                'file_size' => $request->file('avatar')?->getSize(),
            ]);
        }

        // Validate image
        $validated = $request->validate([
            'avatar' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ]);

        $user = $request->user();

        // Store new avatar
        $newPath = $validated['avatar']->store('avatars', 'public');

        if (! $newPath) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload avatar.',
                'data' => null,
            ], 500);
        }

        // Update database
        $oldAvatar = $user->avatar;

        $user->avatar = $newPath;
        $user->save();

        // Delete old avatar after successful save
        if ($oldAvatar) {
            Storage::disk('public')->delete($oldAvatar);
        }

        return response()->json([
            'success' => true,
            'message' => 'Avatar uploaded successfully.',
            'data' => new UserResource(
                $user->fresh()->load(['student', 'lecturer'])
            ),
        ]);
    }

    // DELETE /api/profile/avatar
    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);

            $user->avatar = null;
            $user->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Avatar deleted successfully.',
            'data' => new UserResource(
                $user->fresh()->load(['student', 'lecturer'])
            ),
        ]);
    }
}
