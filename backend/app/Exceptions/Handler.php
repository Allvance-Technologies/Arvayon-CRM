<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });

        $this->renderable(function (Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return $this->handleApiException($e, $request);
            }
        });
    }

    protected function handleApiException(Throwable $e, $request)
    {
        // Validation errors (422)
        if ($e instanceof ValidationException) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        }

        // Authentication errors (401)
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        // Authorization errors (403)
        if ($e instanceof AuthorizationException) {
            return response()->json([
                'message' => 'Unauthorized',
            ], 403);
        }

        // Model not found (404)
        if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
            return response()->json([
                'message' => 'Resource not found',
            ], 404);
        }

        // HTTP exceptions
        if ($e instanceof HttpException) {
            return response()->json([
                'message' => $e->getMessage() ?: 'An error occurred',
            ], $e->getStatusCode());
        }

        // Log unexpected errors
        if (!app()->environment('production')) {
            return response()->json([
                'message' => 'Server error',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }

        // Production: hide error details
        return response()->json([
            'message' => 'An unexpected error occurred',
        ], 500);
    }
}
