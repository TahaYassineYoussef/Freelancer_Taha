<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * A single, reusable notification that powers BOTH the in-app bell (database)
 * and an email. Every activity — new task, task accepted/declined/delivered/
 * approved, changes requested, new message, new review, new contact — creates one.
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
        // Everything lands in the bell. Everything also emails EXCEPT chat
        // messages — a live conversation would flood the inbox otherwise.
        return $this->type === 'message'
            ? ['database']
            : ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->icon.' '.$this->title)
            ->greeting($this->title)
            ->line($this->message)
            ->action('Open', $this->url)
            ->line('You can also see this under the bell on your dashboard.');
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
