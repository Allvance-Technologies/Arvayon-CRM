<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    public function index(Request $request)
    {
        $query = Client::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', "%{$search}%")
                  ->orWhere('contact_person', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Support both paginated and full list (for dropdowns)
        if ($request->boolean('all')) {
            return response()->json(['data' => $query->orderBy('company_name')->get()]);
        }

        return response()->json($query->orderBy('company_name')->paginate(20));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'company_name'   => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:50',
            'address'        => 'nullable|string',
            'industry'       => 'nullable|string|max:100',
        ]);

        $client = Client::create($validated);
        return response()->json(['data' => $client], 201);
    }

    public function show(Client $client)
    {
        return response()->json(['data' => $client->load('projects')]);
    }

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            'company_name'   => 'sometimes|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email'          => 'nullable|email|max:255',
            'phone'          => 'nullable|string|max:50',
            'address'        => 'nullable|string',
            'industry'       => 'nullable|string|max:100',
        ]);

        $client->update($validated);
        return response()->json(['data' => $client]);
    }

    public function destroy(Client $client)
    {
        $client->delete();
        return response()->json(['message' => 'Client deleted']);
    }
}
