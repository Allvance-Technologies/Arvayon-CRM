<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Project;
use App\Models\Task;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2',
        ]);

        $query = $request->input('query');

        $results = [
            'leads' => $this->searchLeads($query),
            'projects' => $this->searchProjects($query),
            'tasks' => $this->searchTasks($query),
            'documents' => $this->searchDocuments($query),
        ];

        return response()->json(['data' => $results]);
    }

    private function searchLeads($query)
    {
        return Lead::where('company_name', 'like', "%{$query}%")
            ->orWhere('contact_person', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->orWhere('notes', 'like', "%{$query}%")
            ->with(['assignedUser'])
            ->limit(10)
            ->get();
    }

    private function searchProjects($query)
    {
        return Project::where('name', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->with(['client', 'projectManager'])
            ->limit(10)
            ->get();
    }

    private function searchTasks($query)
    {
        return Task::where('title', 'like', "%{$query}%")
            ->orWhere('description', 'like', "%{$query}%")
            ->with(['project', 'assignedUser'])
            ->limit(10)
            ->get();
    }

    private function searchDocuments($query)
    {
        return Document::where('name', 'like', "%{$query}%")
            ->with(['project', 'uploadedBy'])
            ->limit(10)
            ->get();
    }
}
