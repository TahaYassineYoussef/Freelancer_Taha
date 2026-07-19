<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AvailabilityController;
use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\ContactMessage;
use App\Models\ModerationLog;
use App\Models\User;
use App\Models\Visit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * The rest of the freelancer's web sidebar, served to the mobile app:
 * Visitors, Bookings, Availability, Inbox and Blocked.
 */
class AdminController extends Controller
{
    // ---- Visitors ----------------------------------------------------------

    public function visitors(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $today = Carbon::today();
        $recent = Visit::where('created_at', '>=', Carbon::today()->subDays(29))
            ->get(['visitor_id', 'is_new', 'path', 'referrer', 'device', 'created_at']);
        $todayVisits = $recent->filter(fn ($v) => $v->created_at->gte($today));

        return response()->json([
            'kpis' => [
                'online' => Visit::where('created_at', '>=', Carbon::now()->subMinutes(5))
                    ->distinct('visitor_id')->count('visitor_id'),
                'today_views' => $todayVisits->count(),
                'today_visitors' => $todayVisits->pluck('visitor_id')->unique()->count(),
                'today_new' => $todayVisits->where('is_new', true)->pluck('visitor_id')->unique()->count(),
                'month_views' => $recent->count(),
                'month_visitors' => $recent->pluck('visitor_id')->unique()->count(),
                'total_views' => Visit::count(),
            ],
            'top_pages' => $this->top($recent, 'path'),
            'top_referrers' => $this->top($recent->filter(fn ($v) => $v->referrer), 'referrer'),
            'devices' => $this->top($recent->filter(fn ($v) => $v->device), 'device'),
        ]);
    }

    /** @return array<int, array{label:string, count:int}> */
    private function top($visits, string $field): array
    {
        return $visits->groupBy($field)
            ->map->count()
            ->sortDesc()
            ->take(6)
            ->map(fn (int $count, string $label) => ['label' => $label, 'count' => $count])
            ->values()
            ->all();
    }

    // ---- Bookings ----------------------------------------------------------

    public function bookings(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $order = ['pending' => 0, 'confirmed' => 1, 'declined' => 2, 'cancelled' => 3];
        $bookings = Booking::with('user:id,name,email')
            ->orderByDesc('starts_at')
            ->get()
            ->sortBy(fn (Booking $b) => $order[$b->status] ?? 9)
            ->values();

        return response()->json([
            'bookings' => $bookings->map(fn (Booking $b) => [
                'id' => $b->id,
                'starts_at' => $b->starts_at?->toIso8601String(),
                'duration_min' => $b->duration_min,
                'topic' => $b->topic,
                'note' => $b->note,
                'status' => $b->status,
                'client' => $b->user?->name,
                'email' => $b->user?->email,
            ])->values(),
            'counts' => [
                'pending' => $bookings->where('status', 'pending')->count(),
                'confirmed' => $bookings->where('status', 'confirmed')->count(),
            ],
        ]);
    }

    public function reviewBooking(Request $request, Booking $booking): JsonResponse
    {
        $this->assertFreelancer($request);
        abort_unless($booking->status === 'pending', 422, 'Only pending requests can be answered.');

        $data = $request->validate([
            'status' => ['required', 'in:confirmed,declined'],
        ]);

        $booking->update($data);

        return response()->json([
            'booking' => ['id' => $booking->id, 'status' => $booking->status],
            'message' => $data['status'] === 'confirmed' ? 'Booking confirmed.' : 'Booking declined.',
        ]);
    }

    // ---- Availability ------------------------------------------------------

    public function availability(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        return response()->json([
            'schedule' => AvailabilityController::schedule($request->user()),
        ]);
    }

    /** Save one weekday's working hours. */
    public function updateAvailability(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $data = $request->validate([
            'day' => ['required', 'integer', 'min:0', 'max:6'],
            'is_open' => ['required', 'boolean'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ]);

        $request->user()->availabilities()->updateOrCreate(
            ['day_of_week' => $data['day']],
            [
                'is_open' => $data['is_open'],
                'start_time' => $data['start_time'],
                'end_time' => $data['end_time'],
            ],
        );

        return response()->json([
            'schedule' => AvailabilityController::schedule($request->user()->fresh()),
            'message' => 'Availability saved.',
        ]);
    }

    // ---- Inbox -------------------------------------------------------------

    public function inbox(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $messages = ContactMessage::latest()->limit(200)->get();

        return response()->json([
            'messages' => $messages->map(fn (ContactMessage $m) => [
                'id' => $m->id,
                'name' => $m->name,
                'email' => $m->email,
                'subject' => $m->subject,
                'body' => $m->body,
                'read' => $m->read_at !== null,
                'created_at' => $m->created_at?->toIso8601String(),
            ])->values(),
            'unread' => ContactMessage::whereNull('read_at')->count(),
        ]);
    }

    public function readMessage(Request $request, ContactMessage $message): JsonResponse
    {
        $this->assertFreelancer($request);

        $message->update(['read_at' => now()]);

        return response()->json(['unread' => ContactMessage::whereNull('read_at')->count()]);
    }

    public function destroyMessage(Request $request, ContactMessage $message): JsonResponse
    {
        $this->assertFreelancer($request);
        $message->delete();

        return response()->json(['deleted' => true]);
    }

    // ---- Blocked (moderation log) ------------------------------------------

    public function blocked(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $logs = ModerationLog::with('user:id,name,email')->latest()->limit(200)->get();

        return response()->json([
            'logs' => $logs->map(fn (ModerationLog $l) => [
                'id' => $l->id,
                'category' => $l->category,
                'detected_by' => $l->detected_by,
                'content' => $l->content,
                'reason' => $l->reason,
                'author' => $l->user?->name,
                'created_at' => $l->created_at?->toIso8601String(),
            ])->values(),
            'stats' => [
                'total' => ModerationLog::count(),
                'scam' => ModerationLog::whereIn('category', ['scam', 'spam'])->count(),
                'profanity' => ModerationLog::whereIn('category', ['profanity', 'insult'])->count(),
                'by_ai' => ModerationLog::where('detected_by', 'ai')->count(),
            ],
        ]);
    }

    public function destroyBlocked(Request $request, ModerationLog $log): JsonResponse
    {
        $this->assertFreelancer($request);
        $log->delete();

        return response()->json(['deleted' => true]);
    }

    // ---- Manage CV ---------------------------------------------------------

    /** Update the profile header shown on the portfolio. */
    public function updateCvProfile(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $data = $request->validate([
            'headline' => ['nullable', 'string', 'max:255'],
            'headline_fr' => ['nullable', 'string', 'max:255'],
            'headline_ar' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:5000'],
            'bio_fr' => ['nullable', 'string', 'max:5000'],
            'bio_ar' => ['nullable', 'string', 'max:5000'],
            'location' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $request->user()->update($data);

        return response()->json(['message' => 'Profile updated.']);
    }

    /**
     * The freelancer's own CV rows, including the per-language copy the public
     * portfolio endpoint resolves away.
     */
    public function cv(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        /** @var User $me */
        $me = $request->user()->load(['skills', 'services', 'projects', 'diplomas', 'experiences', 'internships']);

        return response()->json([
            'profile' => [
                'headline' => $me->headline, 'headline_fr' => $me->headline_fr, 'headline_ar' => $me->headline_ar,
                'bio' => $me->bio, 'bio_fr' => $me->bio_fr, 'bio_ar' => $me->bio_ar,
                'location' => $me->location, 'phone' => $me->phone,
            ],
            'skills' => $me->skills->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'level' => $s->level]),
            'services' => $me->services->map(fn ($s) => ['id' => $s->id, 'title' => $s->title, 'price' => $s->price]),
            'projects' => $me->projects->map(fn ($p) => ['id' => $p->id, 'title' => $p->title, 'tech_stack' => $p->tech_stack]),
            'diplomas' => $me->diplomas->map(fn ($d) => ['id' => $d->id, 'title' => $d->title, 'institution' => $d->institution]),
            'experiences' => $me->experiences->map(fn ($e) => ['id' => $e->id, 'position' => $e->position, 'company' => $e->company]),
            'internships' => $me->internships->map(fn ($i) => ['id' => $i->id, 'position' => $i->position, 'company' => $i->company]),
        ]);
    }

    // ---- Helpers -----------------------------------------------------------

    private function assertFreelancer(Request $request): void
    {
        abort_unless($request->user()?->isFreelancer(), 403);
    }
}
