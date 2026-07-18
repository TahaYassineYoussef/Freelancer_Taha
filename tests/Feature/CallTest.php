<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\ActivityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class CallTest extends TestCase
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

    public function test_a_missed_call_logs_a_message_and_notifies_the_callee(): void
    {
        Notification::fake();
        $freelancer = $this->freelancer();
        $client = $this->client();

        // Freelancer called the client; the client never answered.
        $this->actingAs($freelancer)
            ->postJson(route('calls.log'), [
                'to_id' => $client->id,
                'kind' => 'video',
                'status' => 'missed',
            ])
            ->assertOk();

        $this->assertDatabaseHas('messages', [
            'sender_id' => $freelancer->id,
            'receiver_id' => $client->id,
            'call_kind' => 'video',
            'call_status' => 'missed',
        ]);

        Notification::assertSentTo($client, ActivityNotification::class);
    }

    public function test_a_completed_call_logs_a_message_without_a_notification(): void
    {
        Notification::fake();
        $freelancer = $this->freelancer();
        $client = $this->client();

        $this->actingAs($freelancer)
            ->postJson(route('calls.log'), [
                'to_id' => $client->id,
                'kind' => 'voice',
                'status' => 'completed',
                'seconds' => 154,
            ])
            ->assertOk();

        $this->assertDatabaseHas('messages', [
            'receiver_id' => $client->id,
            'call_kind' => 'voice',
            'call_status' => 'completed',
            'call_seconds' => 154,
        ]);

        Notification::assertNothingSent();
    }

    public function test_a_client_cannot_log_a_call_to_another_client(): void
    {
        $client = $this->client();
        $other = $this->client();

        $this->actingAs($client)
            ->postJson(route('calls.log'), [
                'to_id' => $other->id,
                'kind' => 'voice',
                'status' => 'missed',
            ])
            ->assertForbidden();
    }
}
