<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Visit;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VisitorTest extends TestCase
{
    use RefreshDatabase;

    private function freelancer(): User
    {
        return User::factory()->create(['role' => 'freelancer']);
    }

    public function test_a_guest_visit_to_the_home_page_is_recorded_as_new(): void
    {
        $this->freelancer();

        $this->get('/')->assertOk();

        $visit = Visit::first();
        $this->assertNotNull($visit);
        $this->assertSame('/', $visit->path);
        $this->assertTrue($visit->is_new);
        $this->assertNotNull($visit->ip_hash);
    }

    public function test_the_site_owners_own_visits_are_not_counted(): void
    {
        $freelancer = $this->freelancer();

        $this->actingAs($freelancer)->get('/')->assertOk();

        $this->assertSame(0, Visit::count());
    }

    public function test_only_the_freelancer_can_open_the_visitors_page(): void
    {
        $freelancer = $this->freelancer();
        $client = User::factory()->create(['role' => 'client']);

        $this->actingAs($client)->get('/visitors')->assertForbidden();
        $this->actingAs($freelancer)->get('/visitors')->assertOk();
    }
}
