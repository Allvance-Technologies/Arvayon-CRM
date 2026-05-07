<?php

namespace App\Http\Controllers;

use App\Models\Proposal;
use App\Models\Project;
use App\Models\Quote;
use Illuminate\Http\Request;

class ProposalController extends Controller
{
    public function index(Request $request)
    {
        $query = Proposal::with(['project', 'quote', 'lead', 'creator']);

        if ($request->has('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'project_id' => 'nullable|exists:projects,id',
            'lead_id' => 'nullable|exists:leads,id',
            'quote_id' => 'nullable|exists:quotes,id',
            'client_name' => 'required|string|max:255',
            'project_location' => 'nullable|string|max:255',
            'project_area' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'estimated_value' => 'nullable|numeric',
            'status' => 'required|in:Draft,Sent,Accepted,Rejected',
            'ai_generated' => 'boolean',
        ]);

        $validated['created_by'] = $request->user()->id;

        $proposal = Proposal::create($validated);

        return response()->json($proposal->load('project', 'quote'), 201);
    }

    public function show(Proposal $proposal)
    {
        return response()->json($proposal->load('project', 'quote', 'creator'));
    }

    public function update(Request $request, Proposal $proposal)
    {
        $validated = $request->validate([
            'title' => 'string|max:255',
            'client_name' => 'string|max:255',
            'project_location' => 'nullable|string|max:255',
            'project_area' => 'nullable|string|max:255',
            'content' => 'nullable|string',
            'status' => 'in:Draft,Sent,Accepted,Rejected',
        ]);

        $proposal->update($validated);

        return response()->json($proposal);
    }

    public function destroy(Proposal $proposal)
    {
        $proposal->delete();
        return response()->json(null, 204);
    }

    public function generateFromTemplate(Request $request)
    {
        $validated = $request->validate([
            'template' => 'required|string',
            'project_id' => 'required|exists:projects,id',
            'quote_id' => 'nullable|exists:quotes,id',
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $quote = null;
        if (!empty($validated['quote_id'])) {
            $quote = Quote::with('items')->find($validated['quote_id']);
        }

        $parsedContent = $validated['template'];

        // Replacements
        $parsedContent = str_replace('[PROJECT_NAME]', $project->name, $parsedContent);
        
        $clientName = $project->client ? $project->client->name : 'Client';
        $parsedContent = str_replace('[CLIENT_NAME]', $clientName, $parsedContent);

        if ($quote) {
            $parsedContent = str_replace('[QUOTE_TOTAL]', '₹' . number_format($quote->total_amount, 2), $parsedContent);
            $parsedContent = str_replace('[QUOTE_NUMBER]', $quote->quote_number, $parsedContent);
            
            // Build simple table for quote items if shortcode exists
            if (strpos($parsedContent, '[QUOTE_ITEMS_TABLE]') !== false) {
                $tableHtml = '<table class="w-full text-left border-collapse"><thead><tr><th class="border-b p-2">Item</th><th class="border-b p-2">Qty</th><th class="border-b p-2">Total</th></tr></thead><tbody>';
                foreach ($quote->items as $item) {
                    $tableHtml .= '<tr>';
                    $tableHtml .= '<td class="border-b p-2">' . htmlspecialchars($item->description) . '</td>';
                    $tableHtml .= '<td class="border-b p-2">' . $item->quantity . '</td>';
                    $tableHtml .= '<td class="border-b p-2">₹' . number_format($item->total, 2) . '</td>';
                    $tableHtml .= '</tr>';
                }
                $tableHtml .= '</tbody></table>';
                
                $parsedContent = str_replace('[QUOTE_ITEMS_TABLE]', $tableHtml, $parsedContent);
            }
        } else {
            // Null out fields if no quote selected
            $parsedContent = str_replace('[QUOTE_TOTAL]', 'TBD', $parsedContent);
            $parsedContent = str_replace('[QUOTE_NUMBER]', 'TBD', $parsedContent);
            $parsedContent = str_replace('[QUOTE_ITEMS_TABLE]', '', $parsedContent);
        }

        return response()->json([
            'parsed_content' => $parsedContent
        ]);
    }
}
