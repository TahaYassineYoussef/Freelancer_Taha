<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\User;
use App\Notifications\ActivityNotification;
use App\Notifications\TaskPosted;
use App\Rules\CleanText;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $me = $request->user();

        $query = $me->role === 'freelancer'
            ? Task::with('user:id,name,email')->latest()
            : $me->tasks()->latest();

        $tasks = $query->with('payments')->get();

        return response()->json([
            'tasks' => $tasks->map(fn (Task $t) => $this->present($t, $me))->values(),
            'counts' => $this->counts($tasks),
        ]);
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

        \App\Support\Notifier::send(User::where('role', 'freelancer')->first(), new TaskPosted($task));

        return response()->json(['task' => $this->present($task->load('payments'), $request->user())], 201);
    }

    // ---- Client actions ----------------------------------------------------

    /**
     * Client approves a delivered task → completed.
     */
    public function approve(Request $request, Task $task): JsonResponse
    {
        $this->assertOwner($request, $task);
        abort_unless($task->status === 'delivered', 422, 'This task has not been delivered yet.');

        $task->update(['status' => 'completed']);

        $this->push($this->freelancer(), 'task', 'Delivery approved',
            "{$request->user()->name} approved “{$task->title}”. 🎉", '🎉');

        return $this->fresh($task, $request->user());
    }

    /**
     * Client asks for changes on a delivered task → back to in progress.
     */
    public function requestChanges(Request $request, Task $task): JsonResponse
    {
        $this->assertOwner($request, $task);
        abort_unless($task->status === 'delivered', 422, 'This task has not been delivered yet.');

        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:2000', new CleanText('feedback a client sent on a delivery')],
        ]);

        $task->update([
            'status' => 'in_progress',
            'revision_note' => $data['note'] ?: null,
        ]);

        $note = ! empty($data['note']) ? ' Note: '.$data['note'] : '';
        $this->push($this->freelancer(), 'revision', 'Changes requested',
            "{$request->user()->name} requested changes on “{$task->title}”.{$note}", '🔁');

        return $this->fresh($task, $request->user());
    }

    /**
     * A client removes one of their own tasks.
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->assertOwner($request, $task);

        if ($task->deliverable_file) {
            Storage::disk('public')->delete($task->deliverable_file);
        }

        $task->delete();

        return response()->json(['deleted' => true]);
    }

    // ---- Freelancer actions ------------------------------------------------

    public function accept(Request $request, Task $task): JsonResponse
    {
        $this->assertFreelancer($request);
        abort_unless($task->status === 'open', 422, 'Only open tasks can be accepted.');

        $task->update(['status' => 'in_progress']);

        $this->push($task->user, 'task', 'Task accepted',
            "Taha accepted your task “{$task->title}” and started working on it.", '✅');

        return $this->fresh($task, $request->user());
    }

    public function decline(Request $request, Task $task): JsonResponse
    {
        $this->assertFreelancer($request);
        abort_unless($task->status === 'open', 422, 'Only open tasks can be declined.');

        $task->update(['status' => 'declined']);

        $this->push($task->user, 'task', 'Task declined',
            "Taha is unable to take on “{$task->title}” right now.", '🚫');

        return $this->fresh($task, $request->user());
    }

    /**
     * Freelancer delivers the work: a file (≤300MB) and/or a link, plus a note.
     */
    public function deliver(Request $request, Task $task): JsonResponse
    {
        $this->assertFreelancer($request);
        abort_unless(in_array($task->status, ['in_progress', 'delivered']), 422, 'This task is not in progress.');

        $data = $request->validate([
            'deliverable_note' => ['nullable', 'string', 'max:2000'],
            'deliverable_link' => ['nullable', 'url', 'max:2000'],
            'deliverable_file' => ['nullable', 'file', 'max:307200'], // 300 MB
        ]);

        if (blank($data['deliverable_link'] ?? null) && ! $request->hasFile('deliverable_file')) {
            abort(422, 'Attach a file or paste a link to deliver.');
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

        $this->push($task->user, 'task', 'Work delivered',
            "Taha delivered “{$task->title}”. Review and approve it.", '📦');

        return $this->fresh($task, $request->user());
    }

    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $this->assertFreelancer($request);

        $data = $request->validate([
            'status' => ['required', Rule::in(['open', 'in_progress', 'delivered', 'completed', 'declined'])],
        ]);

        $task->update($data);

        return $this->fresh($task, $request->user());
    }

    // ---- Helpers -----------------------------------------------------------

    private function fresh(Task $task, User $me): JsonResponse
    {
        return response()->json([
            'task' => $this->present($task->fresh()->load(['payments', 'user:id,name,email']), $me),
        ]);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Task>  $tasks
     * @return array<string, int>
     */
    private function counts($tasks): array
    {
        $counts = ['all' => $tasks->count()];

        foreach (['open', 'in_progress', 'delivered', 'completed', 'declined'] as $status) {
            $counts[$status] = $tasks->where('status', $status)->count();
        }

        return $counts;
    }

    private function present(Task $task, User $me): array
    {
        $payments = $task->relationLoaded('payments') ? $task->payments : collect();

        return [
            'id' => $task->id,
            'title' => $task->title,
            'description' => $task->description,
            'category' => $task->category,
            'budget' => $task->budget,
            'deadline' => $task->deadline?->toDateString(),
            'status' => $task->status,
            'created_at' => $task->created_at?->toIso8601String(),
            'is_paid' => $payments->where('status', 'completed')->isNotEmpty(),
            'pending_payment' => $payments->where('status', 'pending')->isNotEmpty(),
            // Delivery from the freelancer
            'deliverable_note' => $task->deliverable_note,
            'deliverable_link' => $task->deliverable_link,
            'deliverable_url' => $task->deliverable_file ? url(Storage::url($task->deliverable_file)) : null,
            'delivered_at' => $task->delivered_at?->toIso8601String(),
            'revision_note' => $task->revision_note,
            'client' => $me->role === 'freelancer' && $task->relationLoaded('user') && $task->user
                ? ['name' => $task->user->name, 'email' => $task->user->email]
                : null,
        ];
    }

    private function assertOwner(Request $request, Task $task): void
    {
        abort_unless($task->user_id === $request->user()->id, 403);
    }

    private function assertFreelancer(Request $request): void
    {
        abort_unless($request->user()->isFreelancer(), 403);
    }

    private function freelancer(): ?User
    {
        return User::where('role', 'freelancer')->first();
    }

    /**
     * Bell + email notification, sent after the response so a slow mail server
     * never delays the mobile client.
     */
    private function push(?User $user, string $type, string $title, string $message, string $icon): void
    {
        if (! $user) {
            return;
        }

        $notification = new ActivityNotification($type, $title, $message, url('/dashboard'), $icon);

        dispatch(function () use ($user, $notification) {
            try {
                $user->notify($notification);
            } catch (\Throwable $e) {
                Log::warning('Notification send failed: '.$e->getMessage());
            }
        })->afterResponse();
    }
}
