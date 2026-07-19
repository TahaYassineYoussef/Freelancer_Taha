<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ChatController extends Controller
{
    public function partners(Request $request): JsonResponse
    {
        $me = $request->user();

        $partners = $me->role === 'freelancer'
            ? User::where('role', 'client')->orderBy('name')->get(['id', 'name', 'role'])
            : User::where('role', 'freelancer')->orderBy('name')->get(['id', 'name', 'role']);

        // Unread badge per conversation, so the list mirrors the web app.
        $unread = Message::where('receiver_id', $me->id)
            ->whereNull('read_at')
            ->selectRaw('sender_id, COUNT(*) as total')
            ->groupBy('sender_id')
            ->pluck('total', 'sender_id');

        return response()->json([
            'partners' => $partners->map(fn (User $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'role' => $p->role,
                'unread' => (int) ($unread[$p->id] ?? 0),
            ])->values(),
        ]);
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
            'body' => ['nullable', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'max:25600'], // 25 MB, same as web
        ]);

        if (blank($data['body'] ?? null) && ! $request->hasFile('attachment')) {
            abort(422, 'Type a message or attach a file.');
        }

        $payload = [
            'sender_id' => $me->id,
            'receiver_id' => $user->id,
            'body' => $data['body'] ?? '',
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $payload['attachment_path'] = $file->store('chat', 'public');
            $payload['attachment_name'] = $file->getClientOriginalName();
            $payload['attachment_mime'] = $file->getClientMimeType();
        }

        Message::create($payload);

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
            ->get()
            ->map(fn (Message $m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'receiver_id' => $m->receiver_id,
                'body' => $m->body,
                'created_at' => $m->created_at?->toIso8601String(),
                'read' => $m->read_at !== null,
                'attachment_url' => $m->attachment_path ? url(Storage::url($m->attachment_path)) : null,
                'attachment_name' => $m->attachment_name,
                'attachment_mime' => $m->attachment_mime,
            ])
            ->values();
    }
}
