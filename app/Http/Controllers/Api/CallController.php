<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeviceToken;
use App\Models\Message;
use App\Models\Signal;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Call signalling for the mobile app.
 *
 * Mirrors the web CallController exactly — same signal kinds and the same
 * JSON payloads — so a phone and a browser can be the two ends of one call.
 */
class CallController extends Controller
{
    private const KINDS = ['offer', 'answer', 'ice', 'decline', 'hangup'];

    /** Drain every call signal addressed to me, from anyone. */
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

        // Signals are consumed once.
        Signal::whereIn('id', $signals->pluck('id'))->delete();

        return response()->json([
            'signals' => $signals->map(fn (Signal $s) => [
                'kind' => $s->kind,
                'payload' => $s->payload,
                'from_id' => $s->from_id,
                'from_name' => $names[$s->from_id] ?? 'Someone',
            ])->values(),
        ]);
    }

    /** Send one call signal to a specific user. */
    public function signal(Request $request): JsonResponse
    {
        $me = $request->user();

        $data = $request->validate([
            'to_id' => ['required', 'integer', 'exists:users,id'],
            'kind' => ['required', 'string', Rule::in(self::KINDS)],
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

        // A ringing phone can't poll while its app is closed, so an offer is
        // also pushed. The other kinds only matter once the app is awake.
        if ($data['kind'] === 'offer') {
            \App\Support\Fcm::ring($target->id, [
                'type' => 'call',
                'from_id' => $me->id,
                'from_name' => $me->name,
                'video' => str_contains((string) ($data['payload'] ?? ''), '"video":true') ? '1' : '0',
            ]);
        }

        return response()->json(['ok' => true]);
    }

    /**
     * Record how a call ended, dropping the call-log card into the
     * conversation the same way the web client does.
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
            'body' => '',
            'call_kind' => $data['kind'],
            'call_status' => $data['status'],
            'call_seconds' => $data['seconds'] ?? null,
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * Register this device for call pushes. Re-registering the same token just
     * moves it to the current user (a shared phone, or a re-login).
     */
    public function registerDevice(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:512'],
            'platform' => ['nullable', 'string', 'max:20'],
        ]);

        DeviceToken::updateOrCreate(
            ['token' => $data['token']],
            ['user_id' => $request->user()->id, 'platform' => $data['platform'] ?? 'android'],
        );

        return response()->json(['ok' => true]);
    }

    /** Called on logout so the phone stops ringing for the old account. */
    public function forgetDevice(Request $request): JsonResponse
    {
        $data = $request->validate(['token' => ['required', 'string', 'max:512']]);

        DeviceToken::where('token', $data['token'])
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['ok' => true]);
    }

    /** Clients may only call the freelancer, and vice versa. */
    private function assertCanCall(User $me, User $other): void
    {
        $allowed = $me->role === 'freelancer'
            ? $other->role === 'client'
            : $other->role === 'freelancer';

        abort_unless($allowed, 403);
    }
}
