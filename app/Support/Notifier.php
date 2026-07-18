<?php

namespace App\Support;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

/**
 * Sends a notification AFTER the HTTP response and never lets it break the
 * request. Email (SMTP) can be slow, down, or unreachable (e.g. no internet) —
 * without this, a single failed send returns a 500 to the user. Here the send
 * is deferred and any failure is logged and swallowed, so the action always
 * succeeds and the bell/email simply arrive when they can.
 */
class Notifier
{
    public static function send(?object $notifiable, Notification $notification): void
    {
        if (! $notifiable) {
            return;
        }

        dispatch(function () use ($notifiable, $notification) {
            try {
                $notifiable->notify($notification);
            } catch (\Throwable $e) {
                Log::warning('Notification send failed: '.$e->getMessage());
            }
        })->afterResponse();
    }
}
