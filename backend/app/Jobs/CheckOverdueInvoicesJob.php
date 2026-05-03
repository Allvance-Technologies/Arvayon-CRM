<?php

namespace App\Jobs;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckOverdueInvoicesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 1;
    public $timeout = 120;

    public function handle()
    {
        try {
            $overdueInvoices = Invoice::where('due_date', '<', now())
                ->whereNotIn('status', ['Paid', 'Cancelled', 'Overdue'])
                ->get();

            foreach ($overdueInvoices as $invoice) {
                $invoice->update(['status' => 'Overdue']);
                
                // Queue notification job
                SendOverdueInvoiceNotificationJob::dispatch($invoice);
            }

            Log::info("Checked overdue invoices: {$overdueInvoices->count()} invoices marked as overdue");

        } catch (\Exception $e) {
            Log::error("Failed to check overdue invoices: " . $e->getMessage());
            throw $e;
        }
    }

    public function failed(\Throwable $exception)
    {
        Log::error("Check overdue invoices job failed: " . $exception->getMessage());
    }
}
