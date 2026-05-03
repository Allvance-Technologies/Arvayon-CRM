<?php

namespace App\Jobs;

use App\Models\Task;
use App\Mail\TaskReminderMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SendTaskReminderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $task;

    public $tries = 3;
    public $timeout = 60;

    public function __construct(Task $task)
    {
        $this->task = $task;
    }

    public function handle()
    {
        try {
            if ($this->task->assignedUser && $this->task->assignedUser->email) {
                Mail::to($this->task->assignedUser->email)
                    ->send(new TaskReminderMail($this->task));

                $this->task->update(['reminder_sent' => true]);

                Log::info("Task reminder sent for task #{$this->task->id}");
            }
        } catch (\Exception $e) {
            Log::error("Failed to send task reminder: " . $e->getMessage());
            throw $e;
        }
    }

    public function failed(\Throwable $exception)
    {
        Log::error("Task reminder job failed for task #{$this->task->id}: " . $exception->getMessage());
    }
}
