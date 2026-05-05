<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        \Log::info('Login attempt:', $request->only('email'));

        $request->validate([
            'email' => 'required',
            'password' => 'required',
        ]);

        $defaultAdminUser = env('DEFAULT_ADMIN_USER', 'admin');
        $defaultAdminPass = env('DEFAULT_ADMIN_PASSWORD', 'admin123');
        $defaultAdminEmail = 'admin@arvayon.com';

        // Check for default admin login
        if (($request->email === $defaultAdminUser || $request->email === $defaultAdminEmail) && $request->password === $defaultAdminPass) {
            $user = User::withTrashed()
                ->where('username', 'admin')
                ->orWhere('email', $defaultAdminEmail)
                ->first();

            if (!$user) {
                $user = User::create([
                    'name' => 'System Administrator',
                    'username' => 'admin',
                    'email' => $defaultAdminEmail,
                    'password' => Hash::make($defaultAdminPass),
                    'role' => 'Admin',
                    'is_active' => true,
                ]);
            } else {
                if ($user->trashed()) {
                    $user->restore();
                }
                $user->update([
                    'is_active' => true,
                    'role' => 'Admin',
                    'password' => Hash::make($defaultAdminPass), // Ensure password matches env
                ]);
            }
        } else {
            $loginField = filter_var($request->email, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
            \Log::info('Login field determined:', ['field' => $loginField, 'value' => $request->email]);

            $user = User::where($loginField, $request->email)->first();

            if (!$user) {
                \Log::warning('User not found:', ['email' => $request->email]);
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            if (!Hash::check($request->password, $user->password)) {
                \Log::warning('Password mismatch for user:', ['email' => $request->email]);
                throw ValidationException::withMessages([
                    'email' => ['The provided credentials are incorrect.'],
                ]);
            }

            if (!$user->is_active) {
                throw ValidationException::withMessages([
                    'email' => ['Your account has been deactivated.'],
                ]);
            }
        }

        // Update last login
        $user->update(['last_login_at' => now()]);

        // Create token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function user(Request $request)
    {
        return response()->json([
            'data' => $request->user(),
        ]);
    }
}
