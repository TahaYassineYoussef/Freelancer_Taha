<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $me = $request->user();

        $unreadMessages = Message::where('receiver_id', $me->id)
            ->whereNull('read_at')
            ->count();

        if ($me->isFreelancer()) {
            $order = ['open' => 0, 'in_progress' => 1, 'completed' => 2, 'declined' => 3];
            $tasks = Task::with(['user:id,name,email', 'payments'])
                ->latest()
                ->get()
                ->sortBy(fn (Task $task) => $order[$task->status] ?? 99)
                ->values();

            return Inertia::render('Dashboard', [
                'role' => 'freelancer',
                'tasks' => $this->presentTasks($tasks),
                'stats' => $this->stats($tasks, $unreadMessages),
            ]);
        }

        $tasks = $me->tasks()->with('payments')->latest()->get();

        return Inertia::render('Dashboard', [
            'role' => 'client',
            'tasks' => $this->presentTasks($tasks),
            'stats' => $this->stats($tasks, $unreadMessages),
        ]);
    }

    private function presentTasks(Collection $tasks): Collection
    {
        return $tasks->map(function (Task $task) {
            $task->is_paid = $task->payments->where('status', 'completed')->isNotEmpty();
            $task->pending_payment = $task->payments->where('status', 'pending')->isNotEmpty();

            return $task;
        });
    }

    private function stats(Collection $tasks, int $unreadMessages): array
    {
        return [
            'open' => $tasks->where('status', 'open')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'unread_messages' => $unreadMessages,
        ];
    }
}
