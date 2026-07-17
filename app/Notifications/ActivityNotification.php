<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * A single, reusable in-app (database) notification that powers the bell.
 * Every activity — new task, task accepted/delivered/approved, new message,
 * new review, new contact — creates one of these.
 */
class ActivityNotification extends Notification
{
    use Queueable;

    /**
     * @param  string  $type   short slug, e.g. "task", "message", "review"
     * @param  string  $icon   an emoji shown in the dropdown
     */
    public function __construct(
        public string $type,
        public string $title,
        public string $message,
        public string $url,
        public string $icon = '🔔',
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'url' => $this->url,
            'icon' => $this->icon,
        ];
    }
}
