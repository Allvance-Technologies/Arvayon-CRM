<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $query = Task::with(['assignedUser', 'project', 'milestone']);

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('due_date')) {
            $query->whereDate('due_date', $request->due_date);
        }

        return response()->json($query->paginate(15));
    }

    public function myTasks(Request $request)
    {
        $tasks = Task::with(['project', 'milestone'])
            ->where('assigned_to', auth()->id())
            ->orderBy('due_date')
            ->paginate(15);

        return response()->json($tasks);
    }

    public function calendar(Request $request)
    {
        $month = $request->get('month', now()->month);
        $year = $request->get('year', now()->year);

        $tasks = Task::with(['assignedUser', 'project'])
            ->whereYear('due_date', $year)
            ->whereMonth('due_date', $month)
            ->get();

        return response()->json(['data' => $tasks]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'nullable|exists:projects,id',
            'milestone_id' => 'nullable|exists:milestones,id',
            'assigned_to' => 'required|exists:users,id',
            'due_date' => 'required|date',
            'status' => 'nullable|in:Pending,In Progress,Completed,Cancelled',
            'priority' => 'sometimes|in:Low,Medium,High,Urgent',
        ]);

        $validated['created_by'] = auth()->id();

        $task = Task::create($validated);

        return response()->json(['data' => $task], 201);
    }

    public function show(Task $task)
    {
        $task->load(['assignedUser', 'creator', 'project', 'milestone']);
        return response()->json(['data' => $task]);
    }

    public function update(Request $request, Task $task)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:Pending,In Progress,Completed,Cancelled',
            'due_date' => 'sometimes|date',
            'priority' => 'sometimes|in:Low,Medium,High,Urgent',
        ]);

        $task->update($validated);

        return response()->json(['data' => $task]);
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return response()->json(['message' => 'Task deleted successfully']);
    }
}
