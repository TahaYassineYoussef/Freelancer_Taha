<?php

namespace App\Http\Middleware;

use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
                'unreadMessages' => fn () => $request->user()
                    ? Message::where('receiver_id', $request->user()->id)->whereNull('read_at')->count()
                    : 0,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            // Only show the "Continue with Google" button once OAuth is fully set up.
            // Both halves are required: the ID alone would render a button that
            // fails at the token-exchange step.
            'googleEnabled' => (bool) config('services.google.client_id')
                && (bool) config('services.google.client_secret'),
            'paypal' => fn () => [
                // Prefer what the freelancer saved in Payment Settings; fall back to .env.
                'clientId' => $this->freelancer()?->paypal_client_id
                    ?: config('services.paypal.client_id'),
                'currency' => config('services.paypal.currency', 'USD'),
            ],
            'd17' => fn () => $this->d17Details(),
        ];
    }

    /**
     * The freelancer's D17 (DigiPost) wallet details, shown to clients when paying.
     */
    private function d17Details(): array
    {
        $freelancer = $this->freelancer();

        return [
            'number' => $freelancer?->d17_number,
            'qr' => $freelancer?->d17_qr ? Storage::url($freelancer->d17_qr) : null,
        ];
    }

    private ?User $freelancer = null;

    private function freelancer(): ?User
    {
        return $this->freelancer ??= User::where('role', 'freelancer')
            ->first(['id', 'd17_number', 'd17_qr', 'paypal_client_id']);
    }
}
