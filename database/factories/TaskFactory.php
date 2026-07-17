<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Task>
 */
class TaskFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'category' => fake()->randomElement(['Web', 'Mobile', 'Design', 'API']),
            'budget' => fake()->randomFloat(2, 100, 2000),
            'deadline' => fake()->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
            'status' => 'open',
        ];
    }
}
