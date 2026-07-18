<?php

namespace Tests\Feature;

use App\Models\Availability;
use App\Models\Booking;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class BookingTest extends TestCase
{
    use RefreshDatabase;

    private function freelancer(): User
    {
        return User::factory()->create(['role' => 'freelancer']);
    }

    private function client(): User
    {
        return User::factory()->create(['role' => 'client']);
    }

    /** Next occurrence of the given weekday at the given hour, in the future. */
    private function nextSlot(int $dow, int $hour = 10): \Illuminate\Support\Carbon
    {
        $d = now()->addDay()->startOfDay();
        while ((int) $d->format('w') !== $dow) {
            $d->addDay();
        }

        return $d->setTime($hour, 0);
    }

    public function test_freelancer_can_save_weekly_availability(): void
    {
        $freelancer = $this->freelancer();

        $schedule = collect(range(0, 6))->map(fn ($day) => [
            'day' => $day,
            'is_open' => $day === 1, // only Monday
            'start_time' => '10:00',
            'end_time' => '16:00',
        ])->all();

        $this->actingAs($freelancer)
            ->post('/availability', ['schedule' => $schedule])
            ->assertRedirect();

        $this->assertDatabaseHas('availabilities', [
            'user_id' => $freelancer->id,
            'day_of_week' => 1,
            'is_open' => true,
            'start_time' => '10:00',
        ]);
    }

    public function test_client_can_request_a_call_in_an_open_slot(): void
    {
        Notification::fake();
        $this->freelancer();
        $client = $this->client();

        // Monday open 09:00–17:00
        $slot = $this->nextSlot(1, 10);

        $this->actingAs($client)
            ->post('/booking', [
                'starts_at' => $slot->toIso8601String(),
                'topic' => 'Discuss a new website project',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'user_id' => $client->id,
            'topic' => 'Discuss a new website project',
            'status' => 'pending',
        ]);
    }

    public function test_double_booking_the_same_slot_is_rejected(): void
    {
        $this->freelancer();
        $client = $this->client();
        $slot = $this->nextSlot(1, 11);

        Booking::create([
            'user_id' => $client->id,
            'starts_at' => $slot,
            'duration_min' => 60,
            'topic' => 'Taken',
            'status' => 'pending',
        ]);

        $this->actingAs($this->client())
            ->post('/booking', [
                'starts_at' => $slot->toIso8601String(),
                'topic' => 'I want the same slot',
            ])
            ->assertSessionHasErrors('starts_at');
    }

    public function test_freelancer_confirms_a_booking(): void
    {
        Notification::fake();
        $freelancer = $this->freelancer();
        $client = $this->client();

        $booking = Booking::create([
            'user_id' => $client->id,
            'starts_at' => $this->nextSlot(1, 12),
            'duration_min' => 60,
            'topic' => 'Kickoff call',
            'status' => 'pending',
        ]);

        $this->actingAs($freelancer)
            ->patch("/bookings/{$booking->id}/confirm")
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', ['id' => $booking->id, 'status' => 'confirmed']);
    }

    public function test_freelancer_can_open_a_normally_closed_date(): void
    {
        $freelancer = $this->freelancer();
        $client = $this->client();

        // Sundays are closed by default. Open the next Sunday 10:00–12:00.
        $sunday = $this->nextSlot(0, 10);

        $this->actingAs($freelancer)->post('/availability/date', [
            'date' => $sunday->toDateString(),
            'is_open' => true,
            'start_time' => '10:00',
            'end_time' => '12:00',
        ])->assertRedirect();

        $this->assertSame(1, \App\Models\DateAvailability::where('user_id', $freelancer->id)->where('is_open', true)->count());

        // The client can now book that Sunday slot.
        $this->actingAs($client)->post('/booking', [
            'starts_at' => $sunday->toIso8601String(),
            'topic' => 'Weekend catch-up',
        ])->assertRedirect();

        $this->assertDatabaseHas('bookings', ['user_id' => $client->id, 'topic' => 'Weekend catch-up', 'status' => 'pending']);
    }

    public function test_freelancer_can_mark_a_normally_open_date_as_off(): void
    {
        $freelancer = $this->freelancer();
        $client = $this->client();

        // Monday is open by default; mark the next Monday as a day off.
        $monday = $this->nextSlot(1, 10);

        $this->actingAs($freelancer)->post('/availability/date', [
            'date' => $monday->toDateString(),
            'is_open' => false,
            'start_time' => '09:00',
            'end_time' => '17:00',
        ])->assertRedirect();

        // Booking that Monday is now rejected.
        $this->actingAs($client)->post('/booking', [
            'starts_at' => $monday->toIso8601String(),
            'topic' => 'Should be blocked',
        ])->assertSessionHasErrors('starts_at');
    }

    public function test_client_cannot_manage_bookings(): void
    {
        $this->freelancer();
        $client = $this->client();
        $booking = Booking::create([
            'user_id' => $client->id,
            'starts_at' => $this->nextSlot(1, 13),
            'duration_min' => 60,
            'topic' => 'x',
            'status' => 'pending',
        ]);

        $this->actingAs($client)
            ->patch("/bookings/{$booking->id}/confirm")
            ->assertForbidden();
    }
}
