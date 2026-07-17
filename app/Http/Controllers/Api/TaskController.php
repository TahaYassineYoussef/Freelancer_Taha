<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskPosted;
use App\Rules\CleanText;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();

        $query = $me->role === 'freelancer'
            ? Task::with('user:id,name,email')->latest()
            : $me->tasks()->latest();

        $tasks = $query->with('payments')->get()->map(fn (Task $t) => $this->present($t, $me));

        return response()->json(['tasks' => $tasks]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255', new CleanText($ctx = 'a project request a client posted for a freelance developer')],
            'description' => ['required', 'string', 'min:15', new CleanText($ctx)],
            'category' => ['nullable', 'string', 'max:255', new CleanText($ctx)],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'deadline' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $task = $request->user()->tasks()->create([...$data, 'status' => 'open']);

        User::where('role', 'freelancer')->first()?->notify(new TaskPosted($task));

        return response()->json(['task' => $this->present($task->load('payments'), $request->user())], 201);
    }

    private function present(Task $task, User $me): array
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'category' => $task->category,
            'budget' => $task->budget,
            'deadline' => $task->deadline?->toDateString(),
            'status' => $task->status,
            'is_paid' => $task->relationLoaded('payments')
                ? $task->payments->where('status', 'completed')->isNotEmpty()
                : false,
            'client' => $me->role === 'freelancer' && $task->relationLoaded('user') && $task->user
                ? ['name' => $task->user->name, 'email' => $task->user->email]
                : null,
        ];
    }
}
