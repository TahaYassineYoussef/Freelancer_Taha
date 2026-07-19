<?php

namespace App\Support;

use App\Models\DeviceToken;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Minimal Firebase Cloud Messaging (HTTP v1) sender.
 *
 * Implemented directly against the REST API — signing our own JWT with the
 * service-account key — so the project needs no extra composer package.
 *
 * Sends data-only, high-priority messages: the app builds the call UI itself,
 * which is what lets a killed app ring.
 */
class Fcm
{
    /**
     * Ring every device belonging to [$userId].
     *
     * Never throws: a failed push must not break the call signalling that
     * triggered it.
     */
    public static function ring(int $userId, array $data): void
    {
        $tokens = DeviceToken::where('user_id', $userId)->pluck('token');

        if ($tokens->isEmpty()) {
            return;
        }

        $accessToken = self::accessToken();
        $projectId = self::credentials()['project_id'] ?? null;

        if (! $accessToken || ! $projectId) {
            return;
        }

        foreach ($tokens as $token) {
            try {
                $response = Http::withToken($accessToken)
                    ->post("https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send", [
                        'message' => [
                            'token' => $token,
                            // Data-only: Android hands it straight to the app,
                            // even when it is not running.
                            'data' => array_map('strval', $data),
                            'android' => [
                                'priority' => 'HIGH',
                            ],
                        ],
                    ]);

                // A token that the device no longer owns is dead: drop it.
                if ($response->status() === 404 || $response->status() === 400) {
                    DeviceToken::where('token', $token)->delete();
                }
            } catch (\Throwable $e) {
                Log::warning('FCM send failed: '.$e->getMessage());
            }
        }
    }

    /** @return array<string, mixed> */
    private static function credentials(): array
    {
        $path = config('services.fcm.credentials');

        if (! $path || ! is_file($path)) {
            return [];
        }

        return json_decode((string) file_get_contents($path), true) ?: [];
    }

    /**
     * OAuth2 access token for the service account, cached until just before it
     * expires.
     */
    private static function accessToken(): ?string
    {
        return Cache::remember('fcm_access_token', 3300, function () {
            $creds = self::credentials();

            if (empty($creds['client_email']) || empty($creds['private_key'])) {
                Log::warning('FCM credentials missing; set services.fcm.credentials.');

                return null;
            }

            $now = time();
            $claims = [
                'iss' => $creds['client_email'],
                'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
                'aud' => 'https://oauth2.googleapis.com/token',
                'iat' => $now,
                'exp' => $now + 3600,
            ];

            $jwt = self::sign($claims, $creds['private_key']);

            $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
                'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                'assertion' => $jwt,
            ]);

            if (! $response->successful()) {
                Log::warning('FCM token exchange failed: '.$response->body());

                return null;
            }

            return $response->json('access_token');
        });
    }

    /** RS256-signed JWT, base64url encoded. */
    private static function sign(array $claims, string $privateKey): string
    {
        $encode = fn (array $part) => rtrim(strtr(base64_encode(json_encode($part)), '+/', '-_'), '=');

        $body = $encode(['alg' => 'RS256', 'typ' => 'JWT']).'.'.$encode($claims);

        openssl_sign($body, $signature, $privateKey, 'sha256WithRSAEncryption');

        return $body.'.'.rtrim(strtr(base64_encode($signature), '+/', '-_'), '=');
    }
}
