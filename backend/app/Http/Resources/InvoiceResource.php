<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'invoice_number' => $this->invoice_number,
            'amount' => $this->amount,
            'tax_amount' => $this->tax_amount,
            'total_amount' => $this->total_amount,
            'status' => $this->status,
            'issue_date' => $this->issue_date,
            'due_date' => $this->due_date,
            'notes' => $this->notes,
            'project' => $this->project ? [
                'id' => $this->project->id,
                'name' => $this->project->name,
            ] : null,
            'payments' => PaymentResource::collection($this->whenLoaded('payments')),
            'total_paid' => $this->payments->sum('amount'),
            'balance' => $this->total_amount - $this->payments->sum('amount'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
