<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Payment tracking dashboard for the freelancer (admin).
     */
    public function index(): Response
    {
        $payments = Payment::with(['task:id,title,budget,status', 'user:id,name,email'])
            ->latest()
            ->get();

        $completed = $payments->where('status', 'completed');

        return Inertia::render('Payments', [
            'payments' => $payments,
            'stats' => [
                'total_received' => round($completed->sum('amount'), 2),
                'completed_count' => $completed->count(),
                'pending_count' => $payments->where('status', 'pending')->count(),
                'currency' => config('services.paypal.currency', 'USD'),
            ],
        ]);
    }

    /**
     * Record a completed PayPal payment for a task.
     * The client captures the order in the browser, then posts the order id here.
     */
    public function store(Request $request, Task $task): RedirectResponse
    {
        // Only the client who owns the task can pay for it.
        abort_unless($task->user_id === Auth::id(), 403);
        abort_if($task->budget === null, 422, 'This task has no budget to pay.');

        $data = $request->validate([
            'provider_order_id' => ['required', 'string', 'max:255'],
        ]);

        $task->payments()->create([
            'user_id' => Auth::id(),
            'amount' => $task->budget,
            'currency' => config('services.paypal.currency', 'USD'),
            'provider' => 'paypal',
            'provider_order_id' => $data['provider_order_id'],
            'status' => 'completed',
        ]);

        return back()->with('success', 'Payment received. Thank you!');
    }

    /**
     * A client declares a D17 (DigiPost) transfer for a task.
     * It is recorded as PENDING until the freelancer confirms he received it.
     */
    public function storeD17(Request $request, Task $task): RedirectResponse
    {
        abort_unless($task->user_id === Auth::id(), 403);
        abort_if($task->budget === null, 422, 'This task has no budget to pay.');

        $data = $request->validate([
            'provider_order_id' => ['required', 'string', 'max:255'], // the D17 transfer reference
        ]);

        $task->payments()->create([
            'user_id' => Auth::id(),
            'amount' => $task->budget,
            'currency' => 'TND',
            'provider' => 'd17',
            'provider_order_id' => $data['provider_order_id'],
            'status' => 'pending',
        ]);

        return back()->with('success', 'Your D17 payment was submitted. Taha will confirm it shortly.');
    }

    /**
     * The freelancer confirms or rejects a pending D17 payment.
     */
    public function review(Request $request, Payment $payment): RedirectResponse
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(['completed', 'failed'])],
        ]);

        $payment->update(['status' => $data['status']]);

        $msg = $data['status'] === 'completed' ? 'Payment confirmed.' : 'Payment rejected.';

        return back()->with('success', $msg);
    }
}
