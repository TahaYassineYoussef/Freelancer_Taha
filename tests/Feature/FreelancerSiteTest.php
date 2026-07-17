<?php

namespace Tests\Feature;

use App\Models\Message;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FreelancerSiteTest extends TestCase
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

    public function test_home_page_loads_for_guests(): void
    {
        $this->freelancer();

        $this->get('/')->assertOk();
    }

    public function test_client_can_post_a_task(): void
    {
        $client = $this->client();

        $response = $this->actingAs($client)->post('/tasks', [
            'title' => 'Build me a website',
            'description' => 'A modern landing page.',
            'category' => 'Web',
            'budget' => 300,
            'deadline' => now()->addWeek()->toDateString(),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tasks', [
            'user_id' => $client->id,
            'title' => 'Build me a website',
            'status' => 'open',
        ]);
    }

    public function test_freelancer_can_update_task_status_but_client_cannot(): void
    {
        $freelancer = $this->freelancer();
        $client = $this->client();
        $task = Task::factory()->create(['user_id' => $client->id, 'status' => 'open']);

        $this->actingAs($freelancer)
            ->patch("/tasks/{$task->id}/status", ['status' => 'in_progress'])
            ->assertRedirect();
        $this->assertDatabaseHas('tasks', ['id' => $task->id, 'status' => 'in_progress']);

        $this->actingAs($client)
            ->patch("/tasks/{$task->id}/status", ['status' => 'completed'])
            ->assertForbidden();
    }

    public function test_client_can_message_freelancer_and_fetch_conversation(): void
    {
        $freelancer = $this->freelancer();
        $client = $this->client();

        $this->actingAs($client)
            ->post("/chat/{$freelancer->id}/messages", ['body' => 'Hello Taha!'])
            ->assertOk()
            ->assertJsonFragment(['body' => 'Hello Taha!']);

        $this->assertDatabaseHas('messages', [
            'sender_id' => $client->id,
            'receiver_id' => $freelancer->id,
            'body' => 'Hello Taha!',
        ]);

        $this->actingAs($client)
            ->getJson("/chat/{$freelancer->id}/messages")
            ->assertOk()
            ->assertJsonFragment(['body' => 'Hello Taha!']);
    }

    public function test_fetching_marks_messages_as_read(): void
    {
        $freelancer = $this->freelancer();
        $client = $this->client();
        $msg = Message::create([
            'sender_id' => $client->id,
            'receiver_id' => $freelancer->id,
            'body' => 'Unread message',
        ]);

        $this->assertNull($msg->read_at);

        $this->actingAs($freelancer)->getJson("/chat/{$client->id}/messages")->assertOk();

        $this->assertNotNull($msg->fresh()->read_at);
    }

    public function test_only_freelancer_can_access_cv_management(): void
    {
        $this->actingAs($this->client())->get('/cv')->assertForbidden();
        $this->actingAs($this->freelancer())->get('/cv')->assertOk();
    }

    public function test_freelancer_can_add_a_diploma(): void
    {
        $freelancer = $this->freelancer();

        $this->actingAs($freelancer)->post('/cv/diplomas', [
            'title' => 'MSc Software Engineering',
            'institution' => 'ENSA',
            'field' => 'Software',
            'start_year' => 2020,
            'end_year' => 2022,
        ])->assertRedirect();

        $this->assertDatabaseHas('diplomas', [
            'user_id' => $freelancer->id,
            'title' => 'MSc Software Engineering',
        ]);
    }

    public function test_dashboard_renders_for_both_roles(): void
    {
        $this->actingAs($this->freelancer())->get('/dashboard')->assertOk();
        $this->actingAs($this->client())->get('/dashboard')->assertOk();
    }
}
