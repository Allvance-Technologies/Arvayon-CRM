<?php

namespace App\Http\Controllers;

use App\Jobs\PredictProjectDelayJob;
use App\Models\Milestone;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $query = Project::with(['client', 'projectManager']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('client_id')) {
            $query->where('client_id', $request->client_id);
        }

        if ($request->filled('project_manager_id')) {
            $query->where('project_manager_id', $request->project_manager_id);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        \Log::info('Project Store Payload:', $request->all());
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'client_id' => 'required|exists:clients,id',
            'lead_id' => 'nullable|exists:leads,id',
            'description' => 'nullable|string',
            'status' => 'nullable|in:Planning,In Progress,On Hold,Completed,Cancelled',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'estimated_cost' => 'nullable|numeric|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
            'project_manager_id' => 'nullable|exists:users,id',
            'area' => 'nullable|numeric',
            'floors' => 'nullable|integer',
            'complexity' => 'nullable|string',
            'plot_dimensions' => 'nullable|string',
            'architectural_style' => 'nullable|string',
            'site_location_link' => 'nullable|string',
        ]);

        $project = Project::create($validated);

        return response()->json(['data' => $project], 201);
    }

    public function show(Project $project)
    {
        $project->load(['client', 'projectManager', 'milestones', 'tasks', 'documents', 'invoices']);
        $project->profit = $project->calculateProfit();
        
        return response()->json(['data' => $project]);
    }

    public function update(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:Planning,In Progress,On Hold,Completed,Cancelled',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date',
            'estimated_cost' => 'nullable|numeric|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
            'project_manager_id' => 'nullable|exists:users,id',
            'area' => 'nullable|numeric',
            'floors' => 'nullable|integer',
            'complexity' => 'nullable|string',
            'plot_dimensions' => 'nullable|string',
            'architectural_style' => 'nullable|string',
            'site_location_link' => 'nullable|string',
        ]);

        $project->update($validated);

        return response()->json(['data' => $project]);
    }

    public function destroy(Project $project)
    {
        $project->delete();
        return response()->json(['message' => 'Project deleted successfully']);
    }

    public function getMilestones(Project $project)
    {
        $milestones = $project->milestones()->orderBy('due_date')->get();
        return response()->json(['data' => $milestones]);
    }

    public function createMilestone(Request $request, Project $project)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'required|date',
        ]);

        $milestone = $project->milestones()->create($validated);

        return response()->json(['data' => $milestone], 201);
    }

    public function getDocuments(Project $project)
    {
        $documents = $project->documents()->notDeleted()->get();
        return response()->json(['data' => $documents]);
    }

    public function getActivities(Project $project)
    {
        $activities = $project->activities()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $activities]);
    }

    public function predictDelay(Project $project)
    {
        PredictProjectDelayJob::dispatch($project);

        return response()->json([
            'message' => 'Delay prediction job queued successfully',
        ]);
    }
}
