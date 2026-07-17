<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Notifications\TaskPosted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * A client posts a new task for the freelancer.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:255'],
            'budget' => ['nullable', 'numeric', 'min:0'],
            'deadline' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $task = $request->user()->tasks()->create([
            ...$data,
            'status' => 'open',
        ]);

        // Notify the freelancer by email that a new task was posted.
        $freelancer = User::where('role', 'freelancer')->first();
        $freelancer?->notify(new TaskPosted($task));

        return back()->with('success', 'Your task has been posted. Taha will get back to you soon!');
    }

    /**
     * The freelancer updates the status of a task.
     */
    public function updateStatus(Request $request, Task $task): RedirectResponse
    {
        abort_unless(Auth::user()->isFreelancer(), 403);

        $data = $request->validate([
            'status' => ['required', Rule::in(['open', 'in_progress', 'completed', 'declined'])],
        ]);

        $task->update($data);

        return back()->with('success', 'Task status updated.');
    }

    /**
     * A client removes one of their own tasks.
     */
    public function destroy(Task $task): RedirectResponse
    {
        abort_unless($task->user_id === Auth::id(), 403);

        $task->delete();

        return back()->with('success', 'Task removed.');
    }
}
