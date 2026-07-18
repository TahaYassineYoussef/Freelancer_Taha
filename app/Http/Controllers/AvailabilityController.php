<?php

namespace App\Http\Controllers;

use App\Models\Availability;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The freelancer sets his weekly working hours here. Clients then book calls in
 * the free slots these hours generate (see BookingController).
 */
class AvailabilityController extends Controller
{
    public const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    /**
     * Merge the freelancer's saved rows with a sensible default (Mon–Fri 9–17),
     * always returning exactly 7 entries in weekday order.
     *
     * @return array<int, array{day:int, name:string, is_open:bool, start_time:string, end_time:string}>
     */
    public static function schedule(User $freelancer): array
    {
        $saved = $freelancer->availabilities()->get()->keyBy('day_of_week');

        return collect(range(0, 6))->map(function (int $day) use ($saved) {
            $row = $saved->get($day);

            return [
                'day' => $day,
                'name' => self::DAYS[$day],
                'is_open' => $row?->is_open ?? ($day >= 1 && $day <= 5), // default: weekdays open
                'start_time' => $row->start_time ?? '09:00',
                'end_time' => $row->end_time ?? '17:00',
            ];
        })->all();
    }

    public function edit(): Response
    {
        return Inertia::render('Availability', [
            'schedule' => self::schedule(Auth::user()),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'schedule' => ['required', 'array', 'size:7'],
            'schedule.*.day' => ['required', 'integer', 'between:0,6'],
            'schedule.*.is_open' => ['required', 'boolean'],
            'schedule.*.start_time' => ['required', 'date_format:H:i'],
            'schedule.*.end_time' => ['required', 'date_format:H:i'],
        ]);

        foreach ($data['schedule'] as $i => $row) {
            if ($row['is_open'] && $row['end_time'] <= $row['start_time']) {
                return back()->withErrors([
                    "schedule.$i.end_time" => 'Closing time must be after opening time.',
                ]);
            }
        }

        foreach ($data['schedule'] as $row) {
            Availability::updateOrCreate(
                ['user_id' => Auth::id(), 'day_of_week' => $row['day']],
                [
                    'is_open' => $row['is_open'],
                    'start_time' => $row['start_time'],
                    'end_time' => $row['end_time'],
                ],
            );
        }

        return back()->with('success', 'Your availability has been saved.');
    }
}
