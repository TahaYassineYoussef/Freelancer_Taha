<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Freelancer's delivery workspace: tasks to deliver (in progress), delivered
 * (awaiting the client's approval) and recently completed. Deliver from here
 * instead of the crowded dashboard.
 */
class WorkController extends Controller
{
    public function index(): Response
    {
        $tasks = Task::with(['user:id,name,email'])
            ->whereIn('status', ['in_progress', 'delivered', 'completed'])
            ->latest('updated_at')
            ->get()
            ->map(fn (Task $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'status' => $t->status,
                'budget' => $t->budget,
                'deadline' => $t->deadline?->toDateString(),
                'client' => $t->user?->only(['id', 'name', 'email']),
                'revision_note' => $t->revision_note,
                'deliverable_note' => $t->deliverable_note,
                'deliverable_link' => $t->deliverable_link,
                'deliverable_url' => $t->deliverable_file ? Storage::url($t->deliverable_file) : null,
                'delivered_at' => $t->delivered_at?->toDateTimeString(),
            ]);

        return Inertia::render('Work', ['tasks' => $tasks]);
    }
}
