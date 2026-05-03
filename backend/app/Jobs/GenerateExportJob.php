<?php

namespace App\Jobs;

use App\Models\Invoice;
use App\Mail\OverdueInvoiceNotificationMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class GenerateExportJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $type,
        public array $filters,
        public int $userId
    ) {}

    public function handle(): void
    {
        $filename = storage_path("app/exports/{$this->type}_export_" . now()->format('Y-m-d_His') . '.csv');

        try {
            $data = match ($this->type) {
                'leads'    => $this->fetchLeads(),
                'projects' => $this->fetchProjects(),
                'tasks'    => $this->fetchTasks(),
                'invoices' => $this->fetchInvoices(),
                default    => []
            };

            $this->writeCsv($filename, $data);

            Log::info("Export completed: {$filename}");
        } catch (\Exception $e) {
            Log::error("Export failed for type {$this->type}: " . $e->getMessage());
            throw $e;
        }
    }

    private function fetchLeads(): array
    {
        return \App\Models\Lead::with('assignedUser')
            ->when(isset($this->filters['status']), fn($q) => $q->where('status', $this->filters['status']))
            ->get()
            ->toArray();
    }

    private function fetchProjects(): array
    {
        return \App\Models\Project::with(['client', 'projectManager'])
            ->when(isset($this->filters['status']), fn($q) => $q->where('status', $this->filters['status']))
            ->get()
            ->toArray();
    }

    private function fetchTasks(): array
    {
        return \App\Models\Task::with(['assignedUser', 'project'])
            ->when(isset($this->filters['status']), fn($q) => $q->where('status', $this->filters['status']))
            ->get()
            ->toArray();
    }

    private function fetchInvoices(): array
    {
        return \App\Models\Invoice::with('project')
            ->when(isset($this->filters['status']), fn($q) => $q->where('status', $this->filters['status']))
            ->get()
            ->toArray();
    }

    private function writeCsv(string $filename, array $data): void
    {
        if (empty($data)) return;

        $dir = dirname($filename);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $handle = fopen($filename, 'w');
        fputcsv($handle, array_keys($data[0]));
        foreach ($data as $row) {
            fputcsv($handle, $row);
        }
        fclose($handle);
    }
}
