<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::prefix('v1')->group(function () {
    Route::post('/auth/login', [App\Http\Controllers\AuthController::class, 'login']);
});

// Protected routes
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/auth/logout', [App\Http\Controllers\AuthController::class, 'logout']);
    Route::get('/auth/user', [App\Http\Controllers\AuthController::class, 'user']);
    
    // Dashboard
    Route::get('/dashboard', [App\Http\Controllers\DashboardController::class, 'index']);
    
    // Leads
    Route::post('/leads/import', [App\Http\Controllers\LeadController::class, 'import']);
    Route::apiResource('leads', App\Http\Controllers\LeadController::class);
    Route::patch('/leads/{lead}/status', [App\Http\Controllers\LeadController::class, 'updateStatus']);
    Route::post('/leads/{lead}/notes', [App\Http\Controllers\LeadController::class, 'addNote']);
    Route::get('/leads/{lead}/activities', [App\Http\Controllers\LeadController::class, 'getActivities']);
    Route::post('/leads/{lead}/score', [App\Http\Controllers\LeadController::class, 'triggerScoring']);
    
    // Projects
    Route::apiResource('projects', App\Http\Controllers\ProjectController::class);
    Route::get('/projects/{project}/milestones', [App\Http\Controllers\ProjectController::class, 'getMilestones']);
    Route::post('/projects/{project}/milestones', [App\Http\Controllers\ProjectController::class, 'createMilestone']);
    Route::get('/projects/{project}/documents', [App\Http\Controllers\ProjectController::class, 'getDocuments']);
    Route::post('/projects/{project}/documents', [App\Http\Controllers\DocumentController::class, 'upload']);
    Route::get('/projects/{project}/activities', [App\Http\Controllers\ProjectController::class, 'getActivities']);
    Route::post('/projects/{project}/predict-delay', [App\Http\Controllers\ProjectController::class, 'predictDelay']);
    
    // Tasks
    Route::get('/tasks/my', [App\Http\Controllers\TaskController::class, 'myTasks']);
    Route::get('/tasks/calendar', [App\Http\Controllers\TaskController::class, 'calendar']);
    Route::apiResource('tasks', App\Http\Controllers\TaskController::class);
    
    // Invoices & Payments
    Route::apiResource('invoices', App\Http\Controllers\InvoiceController::class);
    Route::post('/invoices/{invoice}/payments', [App\Http\Controllers\InvoiceController::class, 'recordPayment']);
    Route::apiResource('payments', App\Http\Controllers\PaymentController::class);
    Route::get('/financial/reports', [App\Http\Controllers\InvoiceController::class, 'reports']);

    // Quotes & Proposals
    Route::get('/projects/{project}/billing-data', [App\Http\Controllers\QuoteController::class, 'getBillingData']);
    Route::apiResource('quotes', App\Http\Controllers\QuoteController::class);
    Route::apiResource('proposals', App\Http\Controllers\ProposalController::class);
    Route::post('/proposals/generate-from-template', [App\Http\Controllers\ProposalController::class, 'generateFromTemplate']);
    
    // Documents
    Route::get('/documents/{document}/download', [App\Http\Controllers\DocumentController::class, 'download']);
    Route::delete('/documents/{document}', [App\Http\Controllers\DocumentController::class, 'destroy']);
    
    // Search
    Route::get('/search', [App\Http\Controllers\SearchController::class, 'search']);
    
    // Saved Filters
    Route::apiResource('saved-filters', App\Http\Controllers\SavedFilterController::class);
    
    // Export
    Route::post('/export/leads', [App\Http\Controllers\ExportController::class, 'exportLeads']);
    Route::post('/export/projects', [App\Http\Controllers\ExportController::class, 'exportProjects']);
    Route::post('/export/tasks', [App\Http\Controllers\ExportController::class, 'exportTasks']);
    Route::post('/export/invoices', [App\Http\Controllers\ExportController::class, 'exportInvoices']);
    
    // AI Feedback
    Route::post('/ai-feedback', [App\Http\Controllers\AIFeedbackController::class, 'store']);
    Route::get('/ai-feedback/metrics', [App\Http\Controllers\AIFeedbackController::class, 'metrics']);
    
    // User Management (Admin only)
    Route::middleware('role:Admin')->group(function () {
        Route::apiResource('users', App\Http\Controllers\UserController::class);
        Route::post('/users/{user}/activate', [App\Http\Controllers\UserController::class, 'activate']);
        Route::post('/users/{user}/deactivate', [App\Http\Controllers\UserController::class, 'deactivate']);
        Route::post('/users/{user}/reset-password', [App\Http\Controllers\UserController::class, 'resetPassword']);
    });

    // Employee Management
    Route::apiResource('employees', App\Http\Controllers\EmployeeController::class);
    Route::get('/employees/{employee}/tasks', [App\Http\Controllers\EmployeeController::class, 'tasks']);

    // Attendance
    Route::post('/attendance/clock-in', [App\Http\Controllers\AttendanceController::class, 'clockIn']);
    Route::post('/attendance/clock-out', [App\Http\Controllers\AttendanceController::class, 'clockOut']);
    Route::get('/attendance/my-records', [App\Http\Controllers\AttendanceController::class, 'myRecords']);
    Route::get('/attendance/all', [App\Http\Controllers\AttendanceController::class, 'index'])->middleware('role:Admin');
    Route::put('/attendance/{attendance}', [App\Http\Controllers\AttendanceController::class, 'update'])->middleware('role:Admin');

    // Payroll (Admin Only)
    Route::middleware('role:Admin')->group(function () {
        Route::post('/payroll/generate', [App\Http\Controllers\PayrollController::class, 'generateMonthly']);
        Route::apiResource('payrolls', App\Http\Controllers\PayrollController::class);
    });

    // Client Management
    Route::apiResource('clients', App\Http\Controllers\ClientController::class);
});
