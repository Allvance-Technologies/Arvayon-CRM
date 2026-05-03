<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Check for overdue invoices daily at 8 AM
        $schedule->job(new \App\Jobs\CheckOverdueInvoicesJob)->dailyAt('08:00');

        // Send task reminders
        // $schedule->job(new \App\Jobs\SendTaskReminderJob)->dailyAt('09:00');

        // Clean up old activities weekly
        $schedule->command('model:prune')->weekly();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
