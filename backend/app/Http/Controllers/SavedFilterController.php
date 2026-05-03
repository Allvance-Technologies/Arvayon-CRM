<?php

namespace App\Http\Controllers;

use App\Models\SavedFilter;
use Illuminate\Http\Request;

class SavedFilterController extends Controller
{
    public function index()
    {
        $filters = SavedFilter::where('user_id', auth()->id())
            ->orderBy('name')
            ->get();

        return response()->json(['data' => $filters]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'entity_type' => 'required|in:Lead,Project,Task,Invoice',
            'filters' => 'required|array',
        ]);

        $validated['user_id'] = auth()->id();

        $filter = SavedFilter::create($validated);

        return response()->json(['data' => $filter], 201);
    }

    public function show(SavedFilter $savedFilter)
    {
        $this->authorize('view', $savedFilter);
        
        return response()->json(['data' => $savedFilter]);
    }

    public function update(Request $request, SavedFilter $savedFilter)
    {
        $this->authorize('update', $savedFilter);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'filters' => 'sometimes|array',
        ]);

        $savedFilter->update($validated);

        return response()->json(['data' => $savedFilter]);
    }

    public function destroy(SavedFilter $savedFilter)
    {
        $this->authorize('delete', $savedFilter);
        
        $savedFilter->delete();

        return response()->json(['message' => 'Filter deleted successfully']);
    }
}
