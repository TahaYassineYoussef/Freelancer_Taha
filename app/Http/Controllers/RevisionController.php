<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Admin-only queue of pending change requests. A task lands here when a client
 * asks for changes on a delivery; it leaves as soon as Taha re-delivers
 * (which clears the revision note).
 */
class RevisionController extends Controller
{
    public function index(): Response
    {
        $tasks = Task::with('user:id,name,email')
            ->whereNotNull('revision_note')
            ->where('status', 'in_progress')
            ->latest('updated_at')
            ->get()
            ->map(fn (Task $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'revision_note' => $t->revision_note,
                'deadline' => $t->deadline?->toDateString(),
                'budget' => $t->budget,
                'client' => $t->user?->only(['id', 'name', 'email']),
                'previous_note' => $t->deliverable_note,
                'previous_link' => $t->deliverable_link,
                'previous_file' => $t->deliverable_file ? Storage::url($t->deliverable_file) : null,
            ]);

        return Inertia::render('Revisions', ['tasks' => $tasks]);
    }
}
