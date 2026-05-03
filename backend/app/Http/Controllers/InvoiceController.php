<?php

namespace App\Http\Controllers;

use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InvoiceController extends Controller
{
    public function index(Request $request)
    {
        $query = Invoice::with(['project', 'payments']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->has('overdue') && $request->overdue) {
            $query->where('due_date', '<', now())
                  ->where('status', '!=', 'Paid');
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'amount' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'status' => 'nullable|in:Draft,Sent,Paid,Overdue,Cancelled',
            'notes' => 'nullable|string',
        ]);

        $validated['invoice_number'] = 'INV-' . strtoupper(uniqid());
        $validated['total_amount'] = $validated['amount'] + ($validated['tax_amount'] ?? 0);
        $validated['created_by'] = auth()->id();

        $invoice = Invoice::create($validated);

        return response()->json(['data' => $invoice], 201);
    }

    public function show(Invoice $invoice)
    {
        $invoice->load(['project', 'payments']);
        return response()->json(['data' => $invoice]);
    }

    public function update(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'amount' => 'sometimes|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:Draft,Sent,Paid,Overdue,Cancelled',
            'due_date' => 'sometimes|date',
            'notes' => 'nullable|string',
        ]);

        if (isset($validated['amount']) || isset($validated['tax_amount'])) {
            $validated['total_amount'] = ($validated['amount'] ?? $invoice->amount) + 
                                        ($validated['tax_amount'] ?? $invoice->tax_amount);
        }

        $invoice->update($validated);

        return response()->json(['data' => $invoice]);
    }

    public function destroy(Invoice $invoice)
    {
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted successfully']);
    }

    public function recordPayment(Request $request, Invoice $invoice)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_date' => 'required|date',
            'payment_method' => 'nullable|string|max:50',
            'transaction_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        $validated['recorded_by'] = auth()->id();

        $payment = $invoice->payments()->create($validated);

        // Update invoice status if fully paid
        if ($invoice->isFullyPaid()) {
            $invoice->update(['status' => 'Paid']);
        }

        return response()->json(['data' => $payment], 201);
    }

    public function reports(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfYear());
        $endDate = $request->get('end_date', now());

        $monthlyRevenue = Payment::selectRaw('DATE_FORMAT(payment_date, "%Y-%m") as month, SUM(amount) as revenue')
            ->whereBetween('payment_date', [$startDate, $endDate])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $totalRevenue = Payment::whereBetween('payment_date', [$startDate, $endDate])->sum('amount');
        $overdueInvoices = Invoice::where('due_date', '<', now())
            ->where('status', '!=', 'Paid')
            ->count();

        return response()->json([
            'data' => [
                'monthly_revenue' => $monthlyRevenue,
                'total_revenue' => $totalRevenue,
                'overdue_invoices' => $overdueInvoices,
            ],
        ]);
    }
}
