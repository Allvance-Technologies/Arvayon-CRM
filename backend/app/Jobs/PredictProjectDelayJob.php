<?php

namespace App\Jobs;

use App\Models\Project;
use App\Services\AIService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class PredictProjectDelayJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 60;

    public function __construct(
        public Project $project
    ) {}

    public function handle(AIService $aiService): void
    {
        $result = $aiService->predictDelay($this->project);

        if ($result && isset($result['risk_level'])) {
            $this->project->update([
                'ai_delay_risk' => $result['risk_level'],
                'ai_delay_warning' => $result['warning_message'] ?? null,
                'ai_delay_updated_at' => now(),
            ]);

            Log::info('Project delay predicted', [
                'project_id' => $this->project->id,
                'risk_level' => $result['risk_level'],
            ]);
        }
    }

    public function failed(\Throwable $exception): void
    {
        Log::error('Project delay prediction job failed', [
            'project_id' => $this->project->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
