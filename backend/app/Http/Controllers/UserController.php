<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', $request->is_active);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'role' => 'required|in:Admin,Manager,Sales,Architect,Accounts',
        ]);

        $validated['password'] = Hash::make($validated['password']);
        
        // Generate username if not provided
        if (empty($validated['username'])) {
            $validated['username'] = explode('@', $validated['email'])[0] . '_' . rand(100, 999);
        }

        try {
            $user = User::create($validated);
            return response()->json(['data' => $user], 201);
        } catch (\Exception $e) {
            \Log::error('User creation failed: ' . $e->getMessage());
            return response()->json(['message' => 'User creation failed', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(User $user)
    {
        return response()->json(['data' => $user]);
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'role' => 'sometimes|in:Admin,Manager,Sales,Architect,Accounts',
        ]);

        $user->update($validated);

        return response()->json(['data' => $user]);
    }

    public function destroy(User $user)
    {
        // Soft delete
        $user->delete();
        return response()->json(['message' => 'User deactivated successfully']);
    }

    public function activate(User $user)
    {
        $user->update(['is_active' => true]);
        return response()->json(['data' => $user]);
    }

    public function deactivate(User $user)
    {
        $user->update(['is_active' => false]);
        
        // Revoke all tokens
        $user->tokens()->delete();

        return response()->json(['data' => $user]);
    }

    public function resetPassword(Request $request, User $user)
    {
        $newPassword = Str::random(12);
        $user->update(['password' => Hash::make($newPassword)]);

        // In production, send email with new password
        // Mail::to($user->email)->send(new PasswordResetMail($newPassword));

        return response()->json([
            'message' => 'Password reset successfully',
            'temporary_password' => $newPassword, // Remove in production
        ]);
    }
}
