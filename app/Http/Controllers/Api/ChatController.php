<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function partners(Request $request): JsonResponse
    {
        $me = $request->user();

        $partners = $me->role === 'freelancer'
            ? User::where('role', 'client')->orderBy('name')->get(['id', 'name', 'role'])
            : User::where('role', 'freelancer')->orderBy('name')->get(['id', 'name', 'role']);

        return response()->json(['partners' => $partners]);
    }

    public function messages(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        $this->assertCanChat($me, $user);

        Message::where('sender_id', $user->id)
            ->where('receiver_id', $me->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json([
            'messages' => $this->conversation($me->id, $user->id),
        ]);
    }

    public function send(Request $request, User $user): JsonResponse
    {
        $me = $request->user();
        $this->assertCanChat($me, $user);

        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
        ]);

        Message::create([
            'sender_id' => $me->id,
            'receiver_id' => $user->id,
            'body' => $data['body'],
        ]);

        return response()->json([
            'messages' => $this->conversation($me->id, $user->id),
        ], 201);
    }

    private function assertCanChat(User $me, User $other): void
    {
        $allowed = $me->role === 'freelancer'
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
}
