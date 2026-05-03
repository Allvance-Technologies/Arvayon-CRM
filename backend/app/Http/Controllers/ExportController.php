<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Project;
use App\Models\Task;
use App\Models\Invoice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExportController extends Controller
{
    public function exportLeads(Request $request)
    {
        $query = Lead::query();

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $leads = $query->get();

        $csv = $this->generateLeadsCsv($leads);
        $filename = 'leads_export_' . now()->format('Y-m-d_His') . '.csv';

        Storage::put('exports/' . $filename, $csv);

        return response()->json([
            'message' => 'Export completed',
            'download_url' => Storage::url('exports/' . $filename),
        ]);
    }

    public function exportProjects(Request $request)
    {
        $query = Project::with(['client', 'projectManager']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $projects = $query->get();

        $csv = $this->generateProjectsCsv($projects);
        $filename = 'projects_export_' . now()->format('Y-m-d_His') . '.csv';

        Storage::put('exports/' . $filename, $csv);

        return response()->json([
            'message' => 'Export completed',
            'download_url' => Storage::url('exports/' . $filename),
        ]);
    }

    public function exportTasks(Request $request)
    {
        $query = Task::with(['project', 'assignedUser']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', $request->assigned_to);
        }

        $tasks = $query->get();

        $csv = $this->generateTasksCsv($tasks);
        $filename = 'tasks_export_' . now()->format('Y-m-d_His') . '.csv';

        Storage::put('exports/' . $filename, $csv);

        return response()->json([
            'message' => 'Export completed',
            'download_url' => Storage::url('exports/' . $filename),
        ]);
    }

    public function exportInvoices(Request $request)
    {
        $query = Invoice::with(['project', 'payments']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $invoices = $query->get();

        $csv = $this->generateInvoicesCsv($invoices);
        $filename = 'invoices_export_' . now()->format('Y-m-d_His') . '.csv';

        Storage::put('exports/' . $filename, $csv);

        return response()->json([
            'message' => 'Export completed',
            'download_url' => Storage::url('exports/' . $filename),
        ]);
    }

    private function generateLeadsCsv($leads)
    {
        $headers = ['ID', 'Company', 'Contact Person', 'Email', 'Phone', 'Status', 'Budget', 'Created At'];
        $rows = [$headers];

        foreach ($leads as $lead) {
            $rows[] = [
                $lead->id,
                $lead->company_name,
                $lead->contact_person,
                $lead->email,
                $lead->phone,
                $lead->status,
                $lead->budget,
                $lead->created_at,
            ];
        }

        return $this->arrayToCsv($rows);
    }

    private function generateProjectsCsv($projects)
    {
        $headers = ['ID', 'Name', 'Client', 'Status', 'Start Date', 'End Date', 'Estimated Cost', 'Actual Cost'];
        $rows = [$headers];

        foreach ($projects as $project) {
            $rows[] = [
                $project->id,
                $project->name,
                $project->client->company_name ?? '',
                $project->status,
                $project->start_date,
                $project->end_date,
                $project->estimated_cost,
                $project->actual_cost,
            ];
        }

        return $this->arrayToCsv($rows);
    }

    private function generateTasksCsv($tasks)
    {
        $headers = ['ID', 'Title', 'Project', 'Assigned To', 'Status', 'Priority', 'Due Date'];
        $rows = [$headers];

        foreach ($tasks as $task) {
            $rows[] = [
                $task->id,
                $task->title,
                $task->project->name ?? '',
                $task->assignedUser->name ?? '',
                $task->status,
                $task->priority,
                $task->due_date,
            ];
        }

        return $this->arrayToCsv($rows);
    }

    private function generateInvoicesCsv($invoices)
    {
        $headers = ['ID', 'Invoice Number', 'Project', 'Amount', 'Status', 'Issue Date', 'Due Date', 'Total Paid'];
        $rows = [$headers];

        foreach ($invoices as $invoice) {
            $rows[] = [
                $invoice->id,
                $invoice->invoice_number,
                $invoice->project->name ?? '',
                $invoice->total_amount,
                $invoice->status,
                $invoice->issue_date,
                $invoice->due_date,
                $invoice->payments->sum('amount'),
            ];
        }

        return $this->arrayToCsv($rows);
    }

    private function arrayToCsv($array)
    {
        $output = fopen('php://temp', 'r+');
        
        foreach ($array as $row) {
            fputcsv($output, $row);
        }
        
        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);
        
        return $csv;
    }
}
