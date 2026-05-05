<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $userRole = strtolower($request->user()->role ?? '');
        $allowedRoles = array_map('strtolower', $roles);

        if (!in_array($userRole, $allowedRoles)) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to access this resource.',
                'debug_role' => $request->user()->role, // Temporary debug info
            ], 403);
        }

        return $next($request);
    }
}
