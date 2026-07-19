<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Lets the freelancer configure where he receives money, from the browser
 * instead of editing .env.
 */
class PaymentSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        $me = $request->user();

        return Inertia::render('PaymentSettings', [
            'settings' => $me->only(['paypal_email', 'paypal_client_id', 'd17_number', 'paypal_enabled']),
            'd17QrUrl' => $me->d17_qr ? Storage::url($me->d17_qr) : null,
            // True when a client ID is already coming from .env as a fallback.
            'envPaypalClientId' => (bool) config('services.paypal.client_id'),
            'paypalMode' => config('services.paypal.mode', 'sandbox'),
            'currency' => config('services.paypal.currency', 'USD'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'paypal_email' => ['nullable', 'email', 'max:255'],
            'paypal_client_id' => ['nullable', 'string', 'max:500'],
            // Show/hide the PayPal button for clients. Credentials are kept either way.
            'paypal_enabled' => ['nullable', 'boolean'],
            'd17_number' => ['nullable', 'string', 'max:50'],
            'd17_qr' => ['nullable', 'image', 'max:4096'],
        ]);

        $user = $request->user();

        if ($request->hasFile('d17_qr')) {
            if ($user->d17_qr) {
                Storage::disk('public')->delete($user->d17_qr);
            }
            $data['d17_qr'] = $request->file('d17_qr')->store('d17', 'public');
        } else {
            unset($data['d17_qr']);
        }

        $user->update($data);

        return back()->with('success', 'Payment settings saved.');
    }
}
