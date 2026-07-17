<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Models\User;
use App\Notifications\ContactReceived;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Public contact form — no account needed.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        $contact = ContactMessage::create($data);

        User::where('role', 'freelancer')->first()?->notify(new ContactReceived($contact));

        return back()->with('success', 'Thanks for reaching out! Taha will reply to you by email soon.');
    }

    /**
     * Inbox for the freelancer.
     */
    public function index(): Response
    {
        $messages = ContactMessage::latest()->get();

        // Opening the inbox marks everything as read.
        ContactMessage::whereNull('read_at')->update(['read_at' => now()]);

        return Inertia::render('ContactMessages', [
            'messages' => $messages,
        ]);
    }

    public function destroy(ContactMessage $contactMessage): RedirectResponse
    {
        $contactMessage->delete();

        return back()->with('success', 'Message deleted.');
    }
}
