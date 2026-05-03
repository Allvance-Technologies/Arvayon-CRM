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

class SendOverdueInvoiceNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $invoice;

    public $tries = 3;
    public $timeout = 60;

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function handle()
    {
        try {
            if ($this->invoice->project && $this->invoice->project->client) {
                $clientEmail = $this->invoice->project->client->email;
                
                if ($clientEmail) {
                    Mail::to($clientEmail)
                        ->send(new OverdueInvoiceNotificationMail($this->invoice));

                    Log::info("Overdue invoice notification sent for invoice #{$this->invoice->invoice_number}");
                }
            }
        } catch (\Exception $e) {
            Log::error("Failed to send overdue invoice notification: " . $e->getMessage());
            throw $e;
        }
    }

    public function failed(\Throwable $exception)
    {
        Log::error("Overdue invoice notification job failed for invoice #{$this->invoice->invoice_number}: " . $exception->getMessage());
    }
}
