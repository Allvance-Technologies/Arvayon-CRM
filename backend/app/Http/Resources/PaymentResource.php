<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'amount' => $this->amount,
            'payment_date' => $this->payment_date,
            'payment_method' => $this->payment_method,
            'transaction_id' => $this->transaction_reference,
            'notes' => $this->notes,
            'invoice_id' => $this->invoice_id,
            'created_at' => $this->created_at,
        ];
    }
}
