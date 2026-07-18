<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\User;
use App\Notifications\ActivityNotification;
use App\Notifications\TaskPosted;
use App\Rules\CleanText;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * A client posts a new task for the freelancer.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255', new CleanText($ctx = 'a project request a client posted for a freelance developer')],
            'description' => ['required', 'string', 'min:15', new CleanText($ctx)],
            'category' => ['nullable', 'string', 'max:255', new CleanText($ctx)],
            'budget' => ['nullable', 'numeric', 'min:0', 'max:1000000'],
            'deadline' => ['nullable', 'date', 'after_or_equal:today'],
        ]);

        $task = $request->user()->tasks()->create([...$data, 'status' => 'open']);

        $freelancer = $this->freelancer();
        $freelancer?->notify(new TaskPosted($task)); // email
        $freelancer?->notify(new ActivityNotification(
            'task',
            'New task posted',
            "{$request->user()->name} posted “{$task->title}”.",
            route('dashboard', ['task' => $task->id]),
            '📋',
        ));

        return back()->with('success', 'Your task has been posted. Taha will get back to you soon!');
    }

    /**
     * Freelancer accepts an open task → in progress.
     */
    public function accept(Task $task): RedirectResponse
    {
        $this->assertFreelancer();
        abort_unless($task->status === 'open', 422, 'Only open tasks can be accepted.');

        $task->update(['status' => 'in_progress']);

        $this->notify($task->user, $task, 'task', 'Task accepted',
            "Taha accepted your task “{$task->title}” and started working on it.", '✅');

        return back()->with('success', 'Task accepted — it is now in progress.');
    }

    /**
     * Freelancer declines an open task.
     */
    public function decline(Task $task): RedirectResponse
    {
        $this->assertFreelancer();
        abort_unless($task->status === 'open', 422, 'Only open tasks can be declined.');

        $task->update(['status' => 'declined']);

        $this->notify($task->user, $task, 'task', 'Task declined',
            "Taha is unable to take on “{$task->title}” right now.", '🚫');

        return back()->with('success', 'Task declined.');
    }

    /**
     * Freelancer delivers the work: a file (≤300MB) and/or a link, plus a note.
     */
    public function deliver(Request $request, Task $task): RedirectResponse
    {
        $this->assertFreelancer();
        abort_unless(in_array($task->status, ['in_progress', 'delivered']), 422, 'This task is not in progress.');

        $data = $request->validate([
            'deliverable_note' => ['nullable', 'string', 'max:2000'],
            'deliverable_link' => ['nullable', 'url', 'max:2000'],
            'deliverable_file' => ['nullable', 'file', 'max:307200'], // 300 MB
        ]);

        if (blank($data['deliverable_link'] ?? null) && ! $request->hasFile('deliverable_file')) {
            return back()->withErrors(['deliverable_file' => 'Attach a file or paste a link to deliver.']);
        }

        if ($request->hasFile('deliverable_file')) {
            if ($task->deliverable_file) {
                Storage::disk('public')->delete($task->deliverable_file);
            }
            $data['deliverable_file'] = $request->file('deliverable_file')->store('deliverables', 'public');
        }

        $task->update([
            ...$data,
            'status' => 'delivered',
            'delivered_at' => now(),
            'revision_note' => null, // a fresh delivery clears the previous change request
        ]);

        $task->user?->notify(new ActivityNotification(
            'task',
            'Work delivered',
            "Taha delivered “{$task->title}”. Review and approve it.",
            route('deliveries.index', ['task' => $task->id]),
            '📦',
        ));

        return back()->with('success', 'Delivery sent to the client.');
    }

    /**
     * Client approves a delivered task → completed.
     */
    public function approve(Task $task): RedirectResponse
    {
        abort_unless($task->user_id === Auth::id(), 403);
        abort_unless($task->status === 'delivered', 422, 'This task has not been delivered yet.');

        $task->update(['status' => 'completed']);

        $this->freelancer()?->notify(new ActivityNotification(
            'task',
            'Delivery approved',
            "{$task->user->name} approved “{$task->title}”. 🎉",
            route('work.index', ['task' => $task->id]),
            '🎉',
        ));

        return back()->with('success', 'Delivery approved. Thank you!');
    }

    /**
     * Client asks for changes on a delivered task → back to in progress.
     */
    public function requestChanges(Request $request, Task $task): RedirectResponse
    {
        abort_unless($task->user_id === Auth::id(), 403);
        abort_unless($task->status === 'delivered', 422, 'This task has not been delivered yet.');

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:2000', new CleanText('feedback a client sent on a delivery')],
        ]);

        $task->update([
            'status' => 'in_progress',
            'revision_note' => $data['note'] ?: null,
        ]);

        $note = ! empty($data['note']) ? ' Note: '.$data['note'] : '';
        $this->freelancer()?->notify(new ActivityNotification(
            'revision',
            'Changes requested',
            "{$task->user->name} requested changes on “{$task->title}”.{$note}",
            route('revisions.index', ['task' => $task->id]),
            '🔁',
        ));

        return back()->with('success', 'Change request sent.');
    }

    /**
     * The freelancer manually overrides the status (safety hatch).
     */
    public function updateStatus(Request $request, Task $task): RedirectResponse
    {
        $this->assertFreelancer();

        $data = $request->validate([
            'status' => ['required', Rule::in(['open', 'in_progress', 'delivered', 'completed', 'declined'])],
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

        if ($task->deliverable_file) {
            Storage::disk('public')->delete($task->deliverable_file);
        }

        $task->delete();

        return back()->with('success', 'Task removed.');
    }

    // ---- Helpers -----------------------------------------------------------

    private function freelancer(): ?User
    {
        return User::where('role', 'freelancer')->first();
    }

    private function assertFreelancer(): void
    {
        abort_unless(Auth::user()->isFreelancer(), 403);
    }

    private function notify(?User $user, Task $task, string $type, string $title, string $message, string $icon): void
    {
        // Deep-link to the exact task so the dashboard scrolls to and highlights it.
        $url = route('dashboard', ['task' => $task->id]);
        $user?->notify(new ActivityNotification($type, $title, $message, $url, $icon));
    }
}
