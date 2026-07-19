<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ContactMessage;
use App\Models\Task;
use App\Models\Testimonial;
use App\Models\User;
use App\Notifications\ActivityNotification;
use App\Rules\CleanText;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * The client-facing surfaces the web app has that the mobile app also needs:
 * translations, notifications, deliveries, reviews, contact and profile.
 */
class ClientController extends Controller
{
    // ---- Localization ------------------------------------------------------

    /**
     * UI strings for a locale, layered over English so an untranslated key
     * still renders readable text (same strategy as HandleInertiaRequests).
     */
    public function translations(string $locale): JsonResponse
    {
        if (! in_array($locale, ['en', 'fr', 'ar'], true)) {
            $locale = 'en';
        }

        $load = function (string $l): array {
            $path = base_path("lang/{$l}.json");

            return is_file($path)
                ? (json_decode((string) file_get_contents($path), true) ?: [])
                : [];
        };

        return response()->json([
            'locale' => $locale,
            'dir' => $locale === 'ar' ? 'rtl' : 'ltr',
            'messages' => array_merge($load('en'), $load($locale)),
        ]);
    }

    // ---- Notifications -----------------------------------------------------

    public function notifications(Request $request): JsonResponse
    {
        $user = $request->user();

        $items = $user->notifications()->latest()->limit(30)->get()->map(fn ($n) => [
            'id' => $n->id,
            'read' => $n->read_at !== null,
            'created_at' => $n->created_at?->toIso8601String(),
            ...$n->data,
        ]);

        return response()->json([
            'unread' => $user->unreadNotifications()->count(),
            'items' => $items,
        ]);
    }

    public function readAllNotifications(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['unread' => 0]);
    }

    public function readNotification(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->where('id', $id)->first()?->markAsRead();

        return response()->json(['unread' => $request->user()->unreadNotifications()->count()]);
    }

    // ---- Deliveries --------------------------------------------------------

    /**
     * Work the freelancer has delivered (delivered + completed tasks).
     */
    public function deliveries(Request $request): JsonResponse
    {
        $me = $request->user();

        $query = $me->isFreelancer()
            ? Task::with('user:id,name,email')
            : $me->tasks();

        $tasks = $query->whereIn('status', ['delivered', 'completed'])
            ->whereNotNull('delivered_at')
            ->orderByDesc('delivered_at')
            ->get();

        return response()->json([
            'deliveries' => $tasks->map(fn (Task $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'status' => $t->status,
                'deliverable_note' => $t->deliverable_note,
                'deliverable_link' => $t->deliverable_link,
                'deliverable_url' => $t->deliverable_file ? url(Storage::url($t->deliverable_file)) : null,
                'delivered_at' => $t->delivered_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    // ---- Testimonials ------------------------------------------------------

    /**
     * A client leaves a review. Held unapproved until the freelancer publishes it.
     */
    public function storeTestimonial(Request $request): JsonResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['required', 'string', 'min:10', 'max:2000', new CleanText('a client review of a freelance developer')],
            'role_title' => ['nullable', 'string', 'max:255'],
            'task_id' => ['nullable', 'integer', Rule::exists('tasks', 'id')->where('user_id', $request->user()->id)],
        ]);

        $testimonial = Testimonial::create([
            ...$data,
            'user_id' => $request->user()->id,
            'approved' => false,
        ]);

        $this->push(
            User::where('role', 'freelancer')->first(),
            'review',
            'New review',
            "{$request->user()->name} left a {$data['rating']}★ review — approve it to publish.",
            '⭐',
        );

        return response()->json([
            'testimonial' => ['id' => $testimonial->id, 'approved' => false],
            'message' => 'Thanks! Your review will appear once Taha approves it.',
        ], 201);
    }

    // ---- Contact -----------------------------------------------------------

    public function contact(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['nullable', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
        ]);

        ContactMessage::create($data);

        return response()->json(['message' => 'Thanks for reaching out — Taha will reply soon.'], 201);
    }

    // ---- Profile -----------------------------------------------------------

    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
        ]);

        $user->update($data);

        return response()->json(['user' => [
            'id' => $user->id, 'name' => $user->name, 'email' => $user->email, 'role' => $user->role,
        ]]);
    }

    public function updatePassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $request->user()->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'Password updated.']);
    }

    // ---- Helpers -----------------------------------------------------------

    private function push(?User $user, string $type, string $title, string $message, string $icon): void
    {
        if (! $user) {
            return;
        }

        $notification = new ActivityNotification($type, $title, $message, url('/dashboard'), $icon);

        dispatch(function () use ($user, $notification) {
            try {
                $user->notify($notification);
            } catch (\Throwable $e) {
                Log::warning('Notification send failed: '.$e->getMessage());
            }
        })->afterResponse();
    }
}
