<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OverdueInvoiceNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $invoice;

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function build()
    {
        return $this->subject('Overdue Invoice: ' . $this->invoice->invoice_number)
            ->view('emails.overdue-invoice')
            ->with([
                'invoiceNumber' => $this->invoice->invoice_number,
                'totalAmount' => $this->invoice->total_amount,
                'dueDate' => $this->invoice->due_date,
                'projectName' => $this->invoice->project->name ?? 'N/A',
                'daysPastDue' => now()->diffInDays($this->invoice->due_date),
            ]);
    }
}
