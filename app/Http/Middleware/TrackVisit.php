<?php

namespace App\Http\Middleware;

use App\Models\Visit;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Records an anonymous page view for the public site.
 *
 * A first-party cookie holds a random token so we can tell a brand-new visitor
 * from a returning one, without storing anything personal. The IP is kept only
 * as a salted one-way hash (used for nothing but rough de-duplication), so no
 * cookie-consent banner is required.
 *
 * Recording never breaks the page: any failure is swallowed.
 */
class TrackVisit
{
    private const COOKIE = 'vid';

    private const YEAR_MINUTES = 525600;

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        try {
            if ($this->shouldTrack($request)) {
                $this->record($request);
            }
        } catch (\Throwable $e) {
            // Analytics must never take the site down.
        }

        return $response;
    }

    private function shouldTrack(Request $request): bool
    {
        // Only real page loads.
        if (! $request->isMethod('GET')) {
            return false;
        }

        // Inertia partial reloads (the dashboard's 7s live refresh) aren't page views.
        if ($request->header('X-Inertia-Partial-Data')) {
            return false;
        }

        // Don't count the site owner browsing his own site.
        if ($request->user()?->isFreelancer()) {
            return false;
        }

        return true;
    }

    private function record(Request $request): void
    {
        $visitorId = $request->cookie(self::COOKIE);
        $isNew = false;

        if (! $visitorId || ! is_string($visitorId)) {
            $visitorId = Str::random(32);
            $isNew = true;
            Cookie::queue(cookie(self::COOKIE, $visitorId, self::YEAR_MINUTES));
        } else {
            // Cookie survived but we have no history (e.g. data cleared) → treat as new.
            $isNew = ! Visit::where('visitor_id', $visitorId)->exists();
        }

        Visit::create([
            'visitor_id' => $visitorId,
            'is_new' => $isNew,
            'path' => Str::limit($request->path() === '/' ? '/' : '/'.ltrim($request->path(), '/'), 190, ''),
            'referrer' => $this->referrerHost($request),
            'device' => $this->device($request->userAgent() ?? ''),
            'browser' => $this->browser($request->userAgent() ?? ''),
            'language' => substr((string) $request->getPreferredLanguage(['en', 'fr', 'ar']), 0, 5) ?: null,
            'ip_hash' => hash('sha256', $request->ip().config('app.key')),
            'user_id' => $request->user()?->id,
        ]);
    }

    /** Where the visitor came from — host only, and never our own site. */
    private function referrerHost(Request $request): ?string
    {
        $ref = $request->headers->get('referer');
        if (! $ref) {
            return null;
        }

        $host = parse_url($ref, PHP_URL_HOST);
        if (! $host || $host === $request->getHost()) {
            return null;
        }

        return Str::limit(Str::replaceFirst('www.', '', $host), 190, '');
    }

    private function device(string $ua): string
    {
        if (preg_match('/tablet|ipad/i', $ua)) {
            return 'tablet';
        }
        if (preg_match('/mobile|iphone|android/i', $ua)) {
            return 'mobile';
        }

        return 'desktop';
    }

    private function browser(string $ua): string
    {
        return match (true) {
            str_contains($ua, 'Edg') => 'Edge',
            str_contains($ua, 'OPR') || str_contains($ua, 'Opera') => 'Opera',
            str_contains($ua, 'Chrome') => 'Chrome',
            str_contains($ua, 'Firefox') => 'Firefox',
            str_contains($ua, 'Safari') => 'Safari',
            default => 'Other',
        };
    }
}
