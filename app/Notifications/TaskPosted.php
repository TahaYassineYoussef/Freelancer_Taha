<?php

namespace App\Notifications;

use App\Models\Task;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class TaskPosted extends Notification
{
    use Queueable;

    public function __construct(public Task $task)
    {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $client = $this->task->user;

        return (new MailMessage)
            ->subject('New task posted: '.$this->task->title)
            ->greeting('Hello Taha,')
            ->line($client?->name.' has posted a new task for you.')
            ->line('Title: '.$this->task->title)
            ->line('Budget: '.($this->task->budget ? '$'.$this->task->budget : 'Not specified'))
            ->line('Description: '.$this->task->description)
            ->action('View in Dashboard', url('/dashboard'))
            ->line('Log in to your dashboard to respond.');
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
        ];
    }
}
