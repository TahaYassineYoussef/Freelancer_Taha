<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A filterable board of every task (freelancer view): filter by status, search
 * by title/description/client. "New task" notifications deep-link here.
 */
class TaskBoardController extends Controller
{
    public function index(): Response
    {
        $tasks = Task::with(['user:id,name,email', 'payments'])
            ->latest()
            ->get()
            ->map(fn (Task $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'description' => $t->description,
                'category' => $t->category,
                'budget' => $t->budget,
                'deadline' => $t->deadline?->toDateString(),
                'status' => $t->status,
                'created_at' => $t->created_at,
                'is_paid' => $t->payments->where('status', 'completed')->isNotEmpty(),
                'client' => $t->user?->only(['id', 'name', 'email']),
            ]);

        $counts = [
            'all' => $tasks->count(),
            'open' => $tasks->where('status', 'open')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'delivered' => $tasks->where('status', 'delivered')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'declined' => $tasks->where('status', 'declined')->count(),
        ];

        return Inertia::render('Tasks', ['tasks' => $tasks, 'counts' => $counts]);
    }
}
