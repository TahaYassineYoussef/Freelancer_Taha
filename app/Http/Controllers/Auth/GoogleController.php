<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Throwable;

class GoogleController extends Controller
{
    /**
     * Send the user off to Google.
     */
    public function redirect(): RedirectResponse
    {
        if (! config('services.google.client_id') || ! config('services.google.client_secret')) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Google login is not fully configured yet.']);
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Bounce back into the mobile app.
     *
     * A plain 302 to a custom scheme is silently dropped by Chrome, so the jump
     * is made from an interstitial page (with a tappable fallback link).
     */
    private function handoff(string $deepLink, bool $ok): \Illuminate\Http\Response
    {
        return response()->view('auth.google-handoff', [
            'deepLink' => $deepLink,
            'ok' => $ok,
        ]);
    }

    /**
     * Same Google flow, but started from the mobile app.
     *
     * The app opens this in a private browser tab, which does not carry the
     * Laravel session cookie back through Google's redirect — so nothing here
     * may rely on the session. Instead the "this is the mobile flow" marker and
     * the CSRF nonce both travel in the OAuth `state` parameter, with the nonce
     * held in the cache so the callback can still verify it.
     */
    public function redirectMobile(): RedirectResponse
    {
        if (! config('services.google.client_id') || ! config('services.google.client_secret')) {
            return redirect()->route('login')
                ->withErrors(['email' => 'Google login is not fully configured yet.']);
        }

        $nonce = Str::random(40);
        Cache::put(self::mobileStateKey($nonce), true, now()->addMinutes(10));

        return Socialite::driver('google')
            ->stateless()
            ->with(['state' => self::MOBILE_PREFIX.$nonce])
            ->redirect();
    }

    /** Marks an OAuth `state` as belonging to the mobile flow. */
    private const MOBILE_PREFIX = 'm_';

    private static function mobileStateKey(string $nonce): string
    {
        return 'google_mobile_state:'.$nonce;
    }

    /**
     * True when this callback belongs to the mobile flow, consuming the nonce
     * so a state cannot be replayed.
     */
    private function claimMobileState(Request $request): bool
    {
        $state = (string) $request->query('state');

        if (! str_starts_with($state, self::MOBILE_PREFIX)) {
            return false;
        }

        $key = self::mobileStateKey(substr($state, strlen(self::MOBILE_PREFIX)));

        if (! Cache::pull($key)) {
            return false;
        }

        return true;
    }

    /**
     * Google sends the user back here.
     */
    // Returns a redirect for the web flow, or the hand-off view for the app.
    public function callback(Request $request): SymfonyResponse
    {
        // Decided before anything can throw, so the error path also knows
        // whether to answer the app or the web site.
        $isMobile = $this->claimMobileState($request);

        try {
            $driver = Socialite::driver('google');
            $googleUser = $isMobile ? $driver->stateless()->user() : $driver->user();
        } catch (Throwable $e) {
            Log::warning('Google login failed.', [
                'type' => get_class($e),
                'error' => $e->getMessage(),
                'mobile' => $isMobile,
            ]);

            if ($isMobile) {
                return $this->handoff('freelancertaha://auth?error=1', false);
            }

            return redirect()->route('login')
                ->withErrors(['email' => 'Could not sign you in with Google. Please try again.']);
        }

        $user = User::where('google_id', $googleUser->getId())->first();

        // Someone who already registered with this email now signs in with Google:
        // link the accounts rather than creating a duplicate.
        if (! $user && $googleUser->getEmail()) {
            $user = User::where('email', $googleUser->getEmail())->first();
        }

        if ($user) {
            $user->forceFill([
                'google_id' => $googleUser->getId(),
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();
        } else {
            $user = User::create([
                'name' => $googleUser->getName() ?: Str::before($googleUser->getEmail(), '@'),
                'email' => $googleUser->getEmail(),
                'google_id' => $googleUser->getId(),
                'role' => 'client',
                'password' => null, // Google-only account
                'email_verified_at' => now(),
            ]);
        }

        // Mobile app: hand the API token back through the app's deep link.
        // Google forbids OAuth in embedded web views, so this runs in a real
        // (private) browser tab that bounces into the app to finish.
        if ($isMobile) {
            $token = $user->createToken('mobile')->plainTextToken;

            return $this->handoff('freelancertaha://auth?token='.urlencode($token), true);
        }

        Auth::login($user, remember: true);

        return redirect()->intended(route('dashboard'));
    }
}
