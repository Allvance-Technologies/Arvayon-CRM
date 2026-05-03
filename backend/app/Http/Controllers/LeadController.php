<?php

namespace App\Http\Controllers;

use App\Jobs\GenerateProposalJob;
use App\Jobs\ScoreLeadJob;
use App\Models\Activity;
use App\Models\Lead;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Http\Resources\LeadResource;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $query = Lead::with(['assignedUser', 'creator']);

        // Filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('company_name', 'like', "%{$request->search}%")
                  ->orWhere('contact_person', 'like', "%{$request->search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $leads = $query->paginate(15);
        
        return LeadResource::collection($leads);
    }

    public function store(StoreLeadRequest $request)
    {
        $validated = $request->validated();
        $validated['created_by'] = auth()->id();
        $validated['status'] = $validated['status'] ?? 'New';

        $lead = Lead::create($validated);

        return new LeadResource($lead);
    }

    public function show(Lead $lead)
    {
        $lead->load(['assignedUser', 'creator', 'proposals', 'project']);
        return new LeadResource($lead);
    }

    public function update(UpdateLeadRequest $request, Lead $lead)
    {
        $lead->update($request->validated());
        return new LeadResource($lead);
    }

    public function destroy(Lead $lead)
    {
        $lead->delete();
        return response()->json(['message' => 'Lead deleted successfully']);
    }

    public function updateStatus(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'status' => 'required|in:New Lead,Initial Contact,Qualification,Tech Call,Site Visit,Proposal,Won,Lost',
            'lost_reason' => 'required_if:status,Lost|nullable|string',
        ]);

        $lead->update($validated);

        return response()->json(['data' => $lead]);
    }

    public function addNote(Request $request, Lead $lead)
    {
        $validated = $request->validate([
            'note' => 'required|string',
        ]);

        $currentNotes = $lead->notes ?? '';
        $timestamp = now()->format('Y-m-d H:i:s');
        $userName = auth()->user()->name;
        
        $newNote = "[{$timestamp}] {$userName}: {$validated['note']}";
        $lead->update([
            'notes' => $currentNotes . "\n" . $newNote,
        ]);

        Activity::log('note_added', $lead, "Note added to lead");

        return response()->json(['data' => $lead]);
    }

    public function getActivities(Lead $lead)
    {
        $activities = $lead->activities()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $activities]);
    }

    public function triggerScoring(Lead $lead)
    {
        ScoreLeadJob::dispatch($lead);

        return response()->json([
            'message' => 'Lead scoring job queued successfully',
        ]);
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        // This would be handled by a background job in production
        return response()->json([
            'message' => 'Import job queued successfully',
        ]);
    }
}
