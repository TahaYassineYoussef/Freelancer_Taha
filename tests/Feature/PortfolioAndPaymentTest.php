<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PortfolioAndPaymentTest extends TestCase
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

    public function test_freelancer_can_add_skill_and_service(): void
    {
        $f = $this->freelancer();

        $this->actingAs($f)->post('/cv/skills', ['name' => 'Laravel', 'level' => 90])->assertRedirect();
        $this->assertDatabaseHas('skills', ['user_id' => $f->id, 'name' => 'Laravel', 'level' => 90]);

        $this->actingAs($f)->post('/cv/services', ['title' => 'Web Apps', 'price' => 300])->assertRedirect();
        $this->assertDatabaseHas('services', ['user_id' => $f->id, 'title' => 'Web Apps']);
    }

    public function test_freelancer_can_add_project_with_image_and_video(): void
    {
        Storage::fake('public');
        $f = $this->freelancer();

        $response = $this->actingAs($f)->post('/cv/projects', [
            'title' => 'My Portfolio',
            'description' => 'A cool project',
            'tech_stack' => 'Laravel, React',
            'image' => UploadedFile::fake()->image('shot.png'),
            'video' => UploadedFile::fake()->create('demo.mp4', 1000, 'video/mp4'),
        ]);

        $response->assertRedirect();
        $project = $f->projects()->first();
        $this->assertNotNull($project);
        $this->assertNotNull($project->image);
        $this->assertNotNull($project->video);
        Storage::disk('public')->assertExists($project->image);
        Storage::disk('public')->assertExists($project->video);
    }

    public function test_project_rejects_non_video_file_in_video_field(): void
    {
        Storage::fake('public');
        $f = $this->freelancer();

        $this->actingAs($f)->post('/cv/projects', [
            'title' => 'Bad',
            'video' => UploadedFile::fake()->create('notavideo.txt', 10, 'text/plain'),
        ])->assertSessionHasErrors('video');
    }

    public function test_client_cannot_manage_cv(): void
    {
        $this->actingAs($this->client())->post('/cv/skills', ['name' => 'x', 'level' => 10])->assertForbidden();
    }

    public function test_freelancer_can_upload_avatar(): void
    {
        Storage::fake('public');
        $f = $this->freelancer();

        $this->actingAs($f)->patch('/cv/profile', [
            'name' => 'Taha',
            'avatar' => UploadedFile::fake()->image('me.jpg'),
        ])->assertRedirect();

        $f->refresh();
        $this->assertNotNull($f->avatar);
        Storage::disk('public')->assertExists($f->avatar);
    }

    public function test_client_can_pay_for_own_task(): void
    {
        $client = $this->client();
        $task = Task::factory()->create(['user_id' => $client->id, 'budget' => 250]);

        $this->actingAs($client)->post("/tasks/{$task->id}/pay", [
            'provider_order_id' => 'PAYPAL-ORDER-123',
        ])->assertRedirect();

        $this->assertDatabaseHas('payments', [
            'task_id' => $task->id,
            'user_id' => $client->id,
            'status' => 'completed',
            'provider_order_id' => 'PAYPAL-ORDER-123',
        ]);
    }

    public function test_client_cannot_pay_for_someone_elses_task(): void
    {
        $owner = $this->client();
        $intruder = $this->client();
        $task = Task::factory()->create(['user_id' => $owner->id, 'budget' => 100]);

        $this->actingAs($intruder)->post("/tasks/{$task->id}/pay", [
            'provider_order_id' => 'X',
        ])->assertForbidden();
    }

    public function test_home_page_still_loads_with_new_sections(): void
    {
        $this->freelancer();
        $this->get('/')->assertOk();
    }
}
