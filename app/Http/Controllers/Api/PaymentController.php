<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    /**
     * Payment methods available to a client, mirroring the web app's shared
     * Inertia props so mobile honours the same Payment Settings toggles.
     */
    public function config(): JsonResponse
    {
        $f = $this->freelancer();

        return response()->json([
            'paypal' => [
                // Prefer what the freelancer saved in Payment Settings; fall back to .env.
                'client_id' => $f?->paypal_client_id ?: config('services.paypal.client_id'),
                'currency' => config('services.paypal.currency', 'USD'),
                'enabled' => (bool) ($f?->paypal_enabled ?? config('services.paypal.enabled')),
            ],
            'd17' => [
                'number' => $f?->d17_number,
                'qr_url' => $f?->d17_qr ? url(Storage::url($f->d17_qr)) : null,
                'currency' => 'TND',
                'enabled' => (bool) ($f?->d17_enabled ?? true),
            ],
        ]);
    }

    /**
     * Record a completed PayPal payment for a task. The client captures the
     * order in the PayPal checkout, then posts the resulting order id here.
     */
    public function paypal(Request $request, Task $task): JsonResponse
    {
        $this->assertPayable($request, $task);

        $data = $request->validate([
            'provider_order_id' => ['required', 'string', 'max:255'],
        ]);

        $payment = $task->payments()->create([
            'user_id' => $request->user()->id,
            'amount' => $task->budget,
            'currency' => config('services.paypal.currency', 'USD'),
            'provider' => 'paypal',
            'provider_order_id' => $data['provider_order_id'],
            'status' => 'completed',
        ]);

        return response()->json([
            'payment' => $this->present($payment),
            'message' => 'Payment received. Thank you!',
        ], 201);
    }

    /**
     * A client declares a D17 (DigiPost) transfer for a task. Recorded as
     * PENDING until the freelancer confirms he received it.
     */
    public function d17(Request $request, Task $task): JsonResponse
    {
        $this->assertPayable($request, $task);

        $data = $request->validate([
            'provider_order_id' => ['required', 'string', 'max:255'], // the D17 transfer reference
        ]);

        $payment = $task->payments()->create([
            'user_id' => $request->user()->id,
            'amount' => $task->budget,
            'currency' => 'TND',
            'provider' => 'd17',
            'provider_order_id' => $data['provider_order_id'],
            'status' => 'pending',
        ]);

        return response()->json([
            'payment' => $this->present($payment),
            'message' => 'Your D17 payment was submitted. Taha will confirm it shortly.',
        ], 201);
    }

    // ---- Helpers -----------------------------------------------------------

    private function assertPayable(Request $request, Task $task): void
    {
        // Only the client who owns the task can pay for it.
        abort_unless($task->user_id === $request->user()->id, 403);
        abort_if($task->budget === null, 422, 'This task has no budget to pay.');
    }

    private function present(\App\Models\Payment $p): array
    {
        return [
            'id' => $p->id,
            'task_id' => $p->task_id,
            'amount' => $p->amount,
            'currency' => $p->currency,
            'provider' => $p->provider,
            'status' => $p->status,
        ];
    }

    private function freelancer(): ?User
    {
        return User::where('role', 'freelancer')
            ->first(['id', 'd17_number', 'd17_qr', 'd17_enabled', 'paypal_client_id', 'paypal_enabled']);
    }
}
