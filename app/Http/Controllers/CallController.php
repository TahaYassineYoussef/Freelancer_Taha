<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Signal;
use App\Models\User;
use App\Notifications\ActivityNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Global signalling for audio/video calls. Unlike the chat poll (which is tied
 * to one open conversation), this is polled on every dashboard page so a user
 * gets rung wherever they are. Signals are consumed once and then deleted.
 */
class CallController extends Controller
{
    private const KINDS = ['offer', 'answer', 'ice', 'decline', 'hangup'];

    /**
     * Drain every call signal addressed to me, from anyone.
     */
    public function poll(Request $request): JsonResponse
    {
        $me = $request->user();

        $signals = Signal::where('to_id', $me->id)
            ->whereIn('kind', self::KINDS)
            ->orderBy('id')
            ->get(['id', 'from_id', 'kind', 'payload']);

        if ($signals->isEmpty()) {
            return response()->json(['signals' => []]);
        }

        $names = User::whereIn('id', $signals->pluck('from_id')->unique())->pluck('name', 'id');
        Signal::whereIn('id', $signals->pluck('id'))->delete();

        return response()->json([
            'signals' => $signals->map(fn ($s) => [
                'kind' => $s->kind,
                'payload' => $s->payload,
                'from_id' => $s->from_id,
                'from_name' => $names[$s->from_id] ?? 'Someone',
            ])->values(),
        ]);
    }

    /**
     * Send one call signal to a specific user.
     */
    public function signal(Request $request): JsonResponse
    {
        $me = $request->user();

        $data = $request->validate([
            'to_id' => ['required', 'integer', 'exists:users,id'],
            'kind' => ['required', 'string', 'in:offer,answer,ice,decline,hangup'],
            'payload' => ['nullable', 'string'],
        ]);

        $target = User::findOrFail($data['to_id']);
        $this->assertCanCall($me, $target);

        Signal::create([
            'from_id' => $me->id,
            'to_id' => $target->id,
            'kind' => $data['kind'],
            'payload' => $data['payload'] ?? null,
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Record how a call ended. Called once by the caller when the call closes.
     * Drops a call-log entry into the conversation (shown as a Messenger-style
     * card to both people) and, for a missed call, notifies the person who
     * missed it via the bell + email.
     */
    public function log(Request $request): JsonResponse
    {
        $me = $request->user();

        $data = $request->validate([
            'to_id' => ['required', 'integer', 'exists:users,id'],
            'kind' => ['required', 'string', 'in:video,voice'],
            'status' => ['required', 'string', 'in:completed,missed,declined'],
            'seconds' => ['nullable', 'integer', 'min:0', 'max:86400'],
        ]);

        $target = User::findOrFail($data['to_id']);
        $this->assertCanCall($me, $target);

        Message::create([
            'sender_id' => $me->id,
            'receiver_id' => $target->id,
            'call_kind' => $data['kind'],
            'call_status' => $data['status'],
            'call_seconds' => $data['seconds'] ?? null,
        ]);

        if ($data['status'] === 'missed') {
            $video = $data['kind'] === 'video';
            $notification = new ActivityNotification(
                'call',
                'Missed '.($video ? 'video' : 'voice').' call',
                $me->name.' tried to reach you'.($video ? ' on a video call' : '').'.',
                route('chat.index', ['with' => $me->id]),
                $video ? '📹' : '📞',
            );

            dispatch(function () use ($target, $notification) {
                try {
                    $target->notify($notification);
                } catch (\Throwable $e) {
                    Log::warning('Missed-call notification failed: '.$e->getMessage());
                }
            })->afterResponse();
        }

        return response()->json(['ok' => true]);
    }

    /**
     * The freelancer may call any client and vice-versa; clients can't call
     * each other. Mirrors the chat permission rule.
     */
    private function assertCanCall(User $me, User $other): void
    {
        $allowed = $me->isFreelancer()
            ? $other->role === 'client'
            : $other->role === 'freelancer';

        abort_unless($allowed, 403);
    }
}
