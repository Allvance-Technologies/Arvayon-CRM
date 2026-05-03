<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Models\Proposal;
use App\Services\AIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateProposalJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    public function __construct(
        public Lead $lead,
        public ?string $requirements = null
    ) {}

    public function handle(AIService $aiService): void
    {
        $result = $aiService->generateProposal($this->lead, $this->requirements);

        if ($result && isset($result['title'], $result['content'])) {
            Proposal::create([
                'lead_id' => $this->lead->id,
                'title' => $result['title'],
                'content' => $result['content'],
                'estimated_value' => $this->lead->estimated_value,
                'status' => 'Draft',
                'ai_generated' => true,
                'created_by' => auth()->id() ?? 1,
            ]);

            Log::info('Proposal generated successfully', [
                'lead_id' => $this->lead->id,
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Proposal generation job failed', [
            'lead_id' => $this->lead->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
