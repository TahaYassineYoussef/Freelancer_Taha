<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A client's own tasks, filterable by status. Shows delivery, approval and
 * payment state for each.
 */
class ClientTaskController extends Controller
{
    public function index(Request $request): Response
    {
        $tasks = $request->user()->tasks()
            ->with('payments')
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
                'pending_payment' => $t->payments->where('status', 'pending')->isNotEmpty(),
                'deliverable_note' => $t->deliverable_note,
                'deliverable_link' => $t->deliverable_link,
                'deliverable_url' => $t->deliverable_file ? Storage::url($t->deliverable_file) : null,
            ]);

        $counts = [
            'all' => $tasks->count(),
            'open' => $tasks->where('status', 'open')->count(),
            'in_progress' => $tasks->where('status', 'in_progress')->count(),
            'delivered' => $tasks->where('status', 'delivered')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'declined' => $tasks->where('status', 'declined')->count(),
        ];

        return Inertia::render('MyTasks', ['tasks' => $tasks, 'counts' => $counts]);
    }
}
