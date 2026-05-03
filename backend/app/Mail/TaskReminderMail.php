<?php

namespace App\Mail;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TaskReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public $task;

    public function __construct(Task $task)
    {
        $this->task = $task;
    }

    public function build()
    {
        return $this->subject('Task Reminder: ' . $this->task->title)
            ->view('emails.task-reminder')
            ->with([
                'taskTitle' => $this->task->title,
                'taskDescription' => $this->task->description,
                'dueDate' => $this->task->due_date,
                'projectName' => $this->task->project->name ?? 'N/A',
                'priority' => $this->task->priority,
            ]);
    }
}
