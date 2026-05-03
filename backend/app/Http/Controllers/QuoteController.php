<?php

namespace App\Http\Controllers;

use App\Models\Quote;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class QuoteController extends Controller
{
    public function index(Request $request)
    {
        $query = Quote::with(['project', 'creator']);

        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        return response()->json($query->latest()->get());
    }

    public function getBillingData(Project $project)
    {
        $project->load(['milestones', 'tasks']);

        $milestonesTotal = $project->milestones->sum('cost') ?? 0; // Assuming cost field exists, otherwise use 0

        $billingData = [
            'project' => $project,
            'suggested_subtotal' => $project->estimated_cost > 0 ? $project->estimated_cost : $milestonesTotal,
            'milestones' => $project->milestones,
            'tasks_count' => $project->tasks->count(),
        ];

        return response()->json($billingData);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'quote_number' => 'required|string|unique:quotes,quote_number',
            'subtotal' => 'required|numeric',
            'tax' => 'required|numeric',
            'total_amount' => 'required|numeric',
            'valid_until' => 'nullable|date',
            'status' => 'required|in:Draft,Sent,Accepted,Rejected',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric',
            'items.*.total' => 'required|numeric',
        ]);

        try {
            DB::beginTransaction();

            $quote = Quote::create([
                'project_id' => $validated['project_id'],
                'quote_number' => $validated['quote_number'],
                'subtotal' => $validated['subtotal'],
                'tax' => $validated['tax'],
                'total_amount' => $validated['total_amount'],
                'valid_until' => $validated['valid_until'] ?? null,
                'status' => $validated['status'],
                'notes' => $validated['notes'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            $quote->items()->createMany($validated['items']);

            DB::commit();

            return response()->json($quote->load('items', 'project'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to create quote', 'error' => $e->getMessage()], 500);
        }
    }

    public function show(Quote $quote)
    {
        return response()->json($quote->load('items', 'project', 'creator'));
    }

    public function update(Request $request, Quote $quote)
    {
        $validated = $request->validate([
            'status' => 'required|in:Draft,Sent,Accepted,Rejected',
            'notes' => 'nullable|string',
        ]);

        $quote->update($validated);

        return response()->json($quote->load('items'));
    }

    public function destroy(Quote $quote)
    {
        $quote->delete();
        return response()->json(null, 204);
    }
}
