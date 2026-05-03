<?php

namespace App\Services;

use App\Models\Lead;
use App\Models\Project;
use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class AIService
{
    private Client $client;
    private string $baseUrl;
    private string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.ai.url', 'http://localhost:8001');
        $this->apiKey = config('services.ai.key', '');
        
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 30,
            'headers' => [
                'Content-Type' => 'application/json',
                'X-API-Key' => $this->apiKey,
            ],
        ]);
    }

    public function scoreLead(Lead $lead): ?array
    {
        try {
            $response = $this->client->post('/api/score-lead', [
                'json' => [
                    'lead_id' => $lead->id,
                    'company_name' => $lead->company_name,
                    'industry' => $lead->industry,
                    'estimated_value' => $lead->estimated_value,
                    'source' => $lead->source,
                    'days_in_pipeline' => $lead->created_at->diffInDays(now()),
                ],
            ]);

            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            Log::error('AI Service - Lead Scoring Error', [
                'lead_id' => $lead->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function predictDelay(Project $project): ?array
    {
        try {
            $milestonesCompleted = $project->milestones()->where('status', 'Completed')->count();
            $milestonesTotal = $project->milestones()->count();
            
            $daysElapsed = $project->start_date ? $project->start_date->diffInDays(now()) : 0;
            $daysRemaining = $project->end_date ? now()->diffInDays($project->end_date) : 0;

            $response = $this->client->post('/api/predict-delay', [
                'json' => [
                    'project_id' => $project->id,
                    'project_name' => $project->name,
                    'start_date' => $project->start_date?->toDateString(),
                    'end_date' => $project->end_date?->toDateString(),
                    'milestones_completed' => $milestonesCompleted,
                    'milestones_total' => $milestonesTotal,
                    'days_elapsed' => $daysElapsed,
                    'days_remaining' => $daysRemaining,
                ],
            ]);

            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            Log::error('AI Service - Delay Prediction Error', [
                'project_id' => $project->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function generateProposal(Lead $lead, ?string $requirements = null): ?array
    {
        try {
            $response = $this->client->post('/api/generate-proposal', [
                'json' => [
                    'lead_id' => $lead->id,
                    'company_name' => $lead->company_name,
                    'industry' => $lead->industry,
                    'estimated_value' => $lead->estimated_value,
                    'project_type' => null,
                    'requirements' => $requirements,
                ],
            ]);

            return json_decode($response->getBody(), true);
        } catch (\Exception $e) {
            Log::error('AI Service - Proposal Generation Error', [
                'lead_id' => $lead->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
