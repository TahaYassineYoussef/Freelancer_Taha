<?php

namespace App\Notifications;

use App\Models\ContactMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContactReceived extends Notification
{
    use Queueable;

    public function __construct(public ContactMessage $contact)
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
        return (new MailMessage)
            ->subject('New contact message: '.($this->contact->subject ?: 'No subject'))
            ->greeting('Hello Taha,')
            ->line($this->contact->name.' sent you a message from your website.')
            ->line('Email: '.$this->contact->email)
            ->line('Message: '.$this->contact->body)
            ->action('View inbox', url('/contact-messages'))
            ->replyTo($this->contact->email, $this->contact->name);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'contact_id' => $this->contact->id,
            'name' => $this->contact->name,
        ];
    }
}
