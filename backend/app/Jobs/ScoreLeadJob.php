<?php

namespace App\Jobs;

use App\Models\Lead;
use App\Services\AIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ScoreLeadJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    public function __construct(
        public Lead $lead
    ) {}

    public function handle(AIService $aiService): void
    {
        $result = $aiService->scoreLead($this->lead);

        if ($result && isset($result['score'])) {
            $this->lead->update([
                'ai_score' => $result['score'],
                'ai_score_updated_at' => now(),
            ]);

            Log::info('Lead scored successfully', [
                'lead_id' => $this->lead->id,
                'score' => $result['score'],
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Lead scoring job failed', [
            'lead_id' => $this->lead->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
