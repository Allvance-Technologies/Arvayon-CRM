<?php

namespace App\Observers;

use App\Jobs\ScoreLeadJob;
use App\Models\Activity;
use App\Models\Client;
use App\Models\Lead;
use App\Models\Project;

class LeadObserver
{
    public function created(Lead $lead): void
    {
        Activity::log('created', $lead, "Lead created: {$lead->company_name}");
        
        // Enqueue AI scoring job - wrapped in try/catch to prevent queue issues from crashing lead creation
        try {
            ScoreLeadJob::dispatch($lead);
        } catch (\Exception $e) {
            \Log::error("Failed to dispatch ScoreLeadJob: " . $e->getMessage());
        }
    }

    public function updated(Lead $lead): void
    {
        if ($lead->wasChanged('status')) {
            $oldStatus = $lead->getOriginal('status');
            $newStatus = $lead->status;

            Activity::log(
                'status_changed',
                $lead,
                "Lead status changed from {$oldStatus} to {$newStatus}",
                $oldStatus,
                $newStatus
            );

            // Auto-convert to project when status is "Won"
            if ($newStatus === 'Won' && $oldStatus !== 'Won') {
                $this->convertToProject($lead);
            }
        }

        // Re-score if key fields change
        if ($lead->wasChanged(['estimated_value', 'source', 'industry'])) {
            ScoreLeadJob::dispatch($lead);
        }
    }

    protected function convertToProject(Lead $lead): void
    {
        // Prevent duplicates: Check if lead already has a project
        if ($lead->project) {
            return;
        }

        // Create or find client
        $client = Client::firstOrCreate(
            ['company_name' => $lead->company_name],
            [
                'contact_person' => $lead->contact_person,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'industry' => $lead->industry,
            ]
        );

        // Create project (Model boot method handles naming and custom ID)
        $project = Project::create([
            'name' => $lead->company_name . ' Project', // Will be overwritten by boot method
            'client_id' => $client->id,
            'lead_id' => $lead->id,
            'description' => $lead->notes,
            'status' => 'Planning',
            'estimated_cost' => $lead->estimated_value,
            'project_manager_id' => $lead->assigned_to,
        ]);

        $lead->won_date = now();
        $lead->saveQuietly();

        Activity::log('converted', $lead, "Lead converted to project: {$project->name}");
    }
}
