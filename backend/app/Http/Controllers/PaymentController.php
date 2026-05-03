<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Invoice;
use Illuminate\Http\Request;
use App\Http\Resources\PaymentResource;

class PaymentController extends Controller
{
    /**
     * Display the specified payment.
     */
    public function show(Payment $payment)
    {
        return new PaymentResource($payment->load(['invoice', 'recorder']));
    }

    /**
     * Update the specified payment.
     */
    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'amount' => 'sometimes|numeric|min:0.01',
            'payment_date' => 'sometimes|date',
            'payment_method' => 'sometimes|string|max:50',
            'transaction_id' => 'sometimes|nullable|string|max:100',
            'notes' => 'sometimes|nullable|string',
        ]);

        if (isset($validated['transaction_id'])) {
            $validated['transaction_reference'] = $validated['transaction_id'];
            unset($validated['transaction_id']);
        }

        $payment->update($validated);

        // Update invoice status if fully paid logic
        $invoice = $payment->invoice;
        if ($invoice->isFullyPaid()) {
            $invoice->update(['status' => 'Paid']);
        } else {
            $invoice->update(['status' => 'Sent']); // or keep as is?
        }

        return new PaymentResource($payment);
    }

    /**
     * Remove the specified payment.
     */
    public function destroy(Payment $payment)
    {
        $invoice = $payment->invoice;
        $payment->delete();

        // Check if invoice still has payments
        if (!$invoice->isFullyPaid()) {
            $invoice->update(['status' => 'Sent']);
        }

        return response()->json(['message' => 'Payment deleted successfully']);
    }

    /**
     * Store a new payment (Optional fallback, preference is via Invoice recordPayment).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_id' => 'required|exists:invoices,id',
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'payment_method' => 'nullable|string|max:50',
            'transaction_id' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['transaction_id'])) {
            $validated['transaction_reference'] = $validated['transaction_id'];
            unset($validated['transaction_id']);
        }

        $validated['recorded_by'] = auth()->id();

        $payment = Payment::create($validated);

        $invoice = $payment->invoice;
        if ($invoice->isFullyPaid()) {
            $invoice->update(['status' => 'Paid']);
        }

        return new PaymentResource($payment);
    }
}
