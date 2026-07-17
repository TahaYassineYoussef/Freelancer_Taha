<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use App\Notifications\NewChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    public function index(Request $request): Response
    {
        $me = $request->user();
        $partners = $this->partnersFor($me);

        // Determine the currently selected conversation partner.
        $selectedId = $request->integer('with');
        $selected = $partners->firstWhere('id', $selectedId) ?? $partners->first();

        $messages = $selected
            ? $this->conversation($me->id, $selected->id)
            : collect();

        if ($selected) {
            $this->markRead($me->id, $selected->id);
        }

        return Inertia::render('Chat', [
            'partners' => $partners->values(),
            'selectedPartner' => $selected,
            'messages' => $messages,
        ]);
    }

    /**
     * JSON endpoint used by the front-end to poll for new messages.
     */
    public function fetch(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        $this->assertCanChat($me, $user);

        $this->markRead($me->id, $user->id);

        return response()->json([
            'messages' => $this->conversation($me->id, $user->id),
        ]);
    }

    public function store(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        $this->assertCanChat($me, $user);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        $message = Message::create([
            'sender_id' => $me->id,
            'receiver_id' => $user->id,
            'body' => $data['body'],
        ]);

        $user->notify(new NewChatMessage($message));
        $user->notify(new \App\Notifications\ActivityNotification(
            'message',
            'New message',
            "{$me->name}: ".\Illuminate\Support\Str::limit($message->body, 60),
            route('chat.index', ['with' => $me->id]),
            '💬',
        ));

        return response()->json([
            'messages' => $this->conversation($me->id, $user->id),
        ]);
    }

    /**
     * Who the given user is allowed to talk to.
     * - The freelancer talks to every client.
     * - A client talks only to the freelancer.
     */
    private function partnersFor(User $me)
    {
        if ($me->isFreelancer()) {
            return User::where('role', 'client')
                ->orderBy('name')
                ->get(['id', 'name', 'role']);
        }

        return User::where('role', 'freelancer')
            ->orderBy('name')
            ->get(['id', 'name', 'role']);
    }

    private function assertCanChat(User $me, User $other): void
    {
        $allowed = $me->isFreelancer()
            ? $other->role === 'client'
            : $other->role === 'freelancer';

        abort_unless($allowed, 403);
    }

    private function conversation(int $meId, int $otherId)
    {
        return Message::query()
            ->where(fn ($q) => $q->where('sender_id', $meId)->where('receiver_id', $otherId))
            ->orWhere(fn ($q) => $q->where('sender_id', $otherId)->where('receiver_id', $meId))
            ->orderBy('created_at')
            ->get(['id', 'sender_id', 'receiver_id', 'body', 'created_at']);
    }

    private function markRead(int $meId, int $otherId): void
    {
        Message::where('sender_id', $otherId)
            ->where('receiver_id', $meId)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }
}
