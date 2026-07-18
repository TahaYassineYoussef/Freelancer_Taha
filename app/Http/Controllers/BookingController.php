<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\User;
use App\Notifications\ActivityNotification;
use App\Rules\CleanText;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Booking a call with the freelancer.
 *
 *  - Clients see the free slots his weekly availability generates and request one.
 *  - The freelancer confirms or declines each request.
 *
 * Slots are one hour long and generated for the next two weeks, minus anything
 * already booked (pending or confirmed) and anything in the past.
 */
class BookingController extends Controller
{
    private const SLOT_MINUTES = 60;

    private const HORIZON_DAYS = 14;

    // ---- Client side --------------------------------------------------------

    /**
     * The client's booking page: open slots to request + their own bookings.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Booking', [
            'days' => $this->openSlots(),
            'bookings' => $request->user()->bookings()
                ->latest('starts_at')
                ->get()
                ->map(fn (Booking $b) => $this->clientView($b)),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'starts_at' => ['required', 'date', 'after:now'],
            'topic' => ['required', 'string', 'max:120', new CleanText('the subject of a call a client booked')],
            'note' => ['nullable', 'string', 'max:1000', new CleanText('a note a client added to a call booking')],
        ]);

        $starts = Carbon::parse($data['starts_at'])->seconds(0);

        if (! $this->slotIsBookable($starts)) {
            return back()->withErrors(['starts_at' => 'Sorry, that time is no longer available. Please pick another slot.']);
        }

        $booking = $request->user()->bookings()->create([
            'starts_at' => $starts,
            'duration_min' => self::SLOT_MINUTES,
            'topic' => $data['topic'],
            'note' => $data['note'] ?? null,
            'status' => 'pending',
        ]);

        $this->push(
            $this->freelancer(),
            'booking',
            'New call request',
            "{$request->user()->name} requested a call on {$starts->format('D, M j \a\t H:i')} — “{$booking->topic}”.",
            route('bookings.index', ['booking' => $booking->id]),
            '📅',
        );

        return back()->with('success', 'Your call request was sent. Taha will confirm it shortly.');
    }

    /**
     * The client cancels one of their own bookings.
     */
    public function destroy(Booking $booking): RedirectResponse
    {
        abort_unless($booking->user_id === Auth::id(), 403);
        abort_if(in_array($booking->status, ['declined', 'cancelled']), 422, 'This booking is already closed.');

        $booking->update(['status' => 'cancelled']);

        $this->push(
            $this->freelancer(),
            'booking',
            'Call cancelled',
            "{$booking->user->name} cancelled the call on {$booking->starts_at->format('D, M j \a\t H:i')}.",
            route('bookings.index', ['booking' => $booking->id]),
            '🗑️',
        );

        return back()->with('success', 'Booking cancelled.');
    }

    // ---- Freelancer side ----------------------------------------------------

    /**
     * The freelancer's management page for every call request.
     */
    public function manage(): Response
    {
        $this->assertFreelancer();

        $order = ['pending' => 0, 'confirmed' => 1, 'declined' => 2, 'cancelled' => 3];

        $bookings = Booking::with('user:id,name,email')
            ->latest('starts_at')
            ->get()
            ->sortBy(fn (Booking $b) => $order[$b->status] ?? 9)
            ->values()
            ->map(fn (Booking $b) => [
                'id' => $b->id,
                'client' => $b->user?->name ?? 'Someone',
                'email' => $b->user?->email,
                'starts_at' => $b->starts_at->toIso8601String(),
                'date' => $b->starts_at->toDateString(),
                'time' => $b->starts_at->format('H:i'),
                'when' => $b->starts_at->format('D, M j Y — H:i'),
                'ends' => $b->endsAt()->format('H:i'),
                'topic' => $b->topic,
                'note' => $b->note,
                'status' => $b->status,
                'is_past' => $b->starts_at->isPast(),
            ]);

        return Inertia::render('Bookings', [
            'bookings' => $bookings,
            'counts' => [
                'pending' => $bookings->where('status', 'pending')->count(),
                'confirmed' => $bookings->where('status', 'confirmed')->count(),
            ],
        ]);
    }

    public function confirm(Booking $booking): RedirectResponse
    {
        $this->assertFreelancer();
        abort_unless($booking->status === 'pending', 422, 'Only pending requests can be confirmed.');

        $booking->update(['status' => 'confirmed']);

        $this->push(
            $booking->user,
            'booking',
            'Call confirmed',
            "Taha confirmed your call on {$booking->starts_at->format('D, M j \a\t H:i')} — “{$booking->topic}”.",
            route('booking.index', ['booking' => $booking->id]),
            '✅',
        );

        return back()->with('success', 'Call confirmed — the client has been notified.');
    }

    public function decline(Booking $booking): RedirectResponse
    {
        $this->assertFreelancer();
        abort_unless($booking->status === 'pending', 422, 'Only pending requests can be declined.');

        $booking->update(['status' => 'declined']);

        $this->push(
            $booking->user,
            'booking',
            'Call declined',
            "Taha can't make the call on {$booking->starts_at->format('D, M j \a\t H:i')}. Please pick another slot.",
            route('booking.index', ['booking' => $booking->id]),
            '🚫',
        );

        return back()->with('success', 'Request declined — the client has been notified.');
    }

    // ---- Slot generation ----------------------------------------------------

    /**
     * All bookable one-hour slots for the next two weeks, grouped by day.
     *
     * @return array<int, array{date:string, label:string, slots:array}>
     */
    private function openSlots(): array
    {
        $freelancer = $this->freelancer();

        if (! $freelancer) {
            return [];
        }

        // Weekday => [start, end] for open days only.
        $hours = [];
        foreach (AvailabilityController::schedule($freelancer) as $row) {
            if ($row['is_open']) {
                $hours[$row['day']] = [$row['start_time'], $row['end_time']];
            }
        }

        $taken = $this->takenSlots();
        $now = Carbon::now();
        $days = [];

        for ($i = 0; $i < self::HORIZON_DAYS; $i++) {
            $date = $now->copy()->startOfDay()->addDays($i);
            $dow = (int) $date->format('w'); // 0 = Sun … 6 = Sat

            if (! isset($hours[$dow])) {
                continue;
            }

            [$start, $end] = $hours[$dow];
            [$sh, $sm] = array_map('intval', explode(':', $start));
            [$eh, $em] = array_map('intval', explode(':', $end));

            $cursor = $date->copy()->setTime($sh, $sm);
            $close = $date->copy()->setTime($eh, $em);
            $slots = [];

            while ($cursor->copy()->addMinutes(self::SLOT_MINUTES)->lessThanOrEqualTo($close)) {
                $key = $cursor->format('Y-m-d H:i');
                if ($cursor->greaterThan($now) && ! isset($taken[$key])) {
                    $slots[] = [
                        'at' => $cursor->toIso8601String(),
                        'label' => $cursor->format('H:i'),
                    ];
                }
                $cursor->addMinutes(self::SLOT_MINUTES);
            }

            if ($slots) {
                $days[] = [
                    'date' => $date->toDateString(),
                    'label' => $date->format('l, M j'),
                    'slots' => $slots,
                ];
            }
        }

        return $days;
    }

    /**
     * Every future slot that is already spoken for, as a 'Y-m-d H:i' => true map.
     *
     * @return array<string, bool>
     */
    private function takenSlots(): array
    {
        return Booking::whereIn('status', ['pending', 'confirmed'])
            ->where('starts_at', '>=', Carbon::now()->startOfDay())
            ->pluck('starts_at')
            ->mapWithKeys(fn (Carbon $d) => [$d->format('Y-m-d H:i') => true])
            ->all();
    }

    private function slotIsBookable(Carbon $starts): bool
    {
        if ($starts->isPast()) {
            return false;
        }

        // Not already taken.
        if (isset($this->takenSlots()[$starts->format('Y-m-d H:i')])) {
            return false;
        }

        // Falls inside an open day within the horizon.
        if ($starts->greaterThan(Carbon::now()->addDays(self::HORIZON_DAYS))) {
            return false;
        }

        $freelancer = $this->freelancer();
        if (! $freelancer) {
            return false;
        }

        foreach (AvailabilityController::schedule($freelancer) as $row) {
            if ($row['day'] === (int) $starts->format('w') && $row['is_open']) {
                return $starts->format('H:i') >= $row['start_time']
                    && $starts->format('H:i') < $row['end_time'];
            }
        }

        return false;
    }

    private function clientView(Booking $b): array
    {
        return [
            'id' => $b->id,
            'starts_at' => $b->starts_at->toIso8601String(),
            'date' => $b->starts_at->toDateString(),
            'time' => $b->starts_at->format('H:i'),
            'when' => $b->starts_at->format('D, M j Y — H:i'),
            'ends' => $b->endsAt()->format('H:i'),
            'topic' => $b->topic,
            'note' => $b->note,
            'status' => $b->status,
            'is_past' => $b->starts_at->isPast(),
        ];
    }

    // ---- Helpers ------------------------------------------------------------

    private function freelancer(): ?User
    {
        return User::where('role', 'freelancer')->first();
    }

    private function assertFreelancer(): void
    {
        abort_unless(Auth::user()->isFreelancer(), 403);
    }

    /**
     * Send a bell + email notification after the response, so the action returns
     * instantly and a slow or failing email can never break it.
     */
    private function push(?User $user, string $type, string $title, string $message, string $url, string $icon): void
    {
        if (! $user) {
            return;
        }

        $notification = new ActivityNotification($type, $title, $message, $url, $icon);

        dispatch(function () use ($user, $notification) {
            try {
                $user->notify($notification);
            } catch (\Throwable $e) {
                Log::warning('Booking notification failed: '.$e->getMessage());
            }
        })->afterResponse();
    }
}
