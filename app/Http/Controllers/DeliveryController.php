<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Client-facing list of deliveries: work Taha has delivered and everything the
 * client has already approved. This is where "Work delivered" notifications land.
 */
class DeliveryController extends Controller
{
    public function index(Request $request): Response
    {
        $tasks = $request->user()->tasks()
            ->whereIn('status', ['delivered', 'completed'])
            ->latest('delivered_at')
            ->get()
            ->map(fn (Task $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'status' => $t->status,
                'budget' => $t->budget,
                'deadline' => $t->deadline?->toDateString(),
                'delivered_at' => $t->delivered_at?->toDateTimeString(),
                'note' => $t->deliverable_note,
                'link' => $t->deliverable_link,
                'file' => $t->deliverable_file ? Storage::url($t->deliverable_file) : null,
            ]);

        return Inertia::render('Deliveries', ['tasks' => $tasks]);
    }
}
