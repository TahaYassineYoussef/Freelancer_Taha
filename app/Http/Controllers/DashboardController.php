<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Payment;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
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
            $order = ['open' => 0, 'in_progress' => 1, 'delivered' => 2, 'completed' => 3, 'declined' => 4];
            $tasks = Task::with(['user:id,name,email', 'payments'])
                ->latest()
                ->get()
                ->sortBy(fn (Task $task) => $order[$task->status] ?? 99)
                ->values();

            return Inertia::render('Dashboard', [
                'role' => 'freelancer',
                'tasks' => $this->presentTasks($tasks),
                'stats' => $this->stats($tasks, $unreadMessages),
                'kpis' => $this->freelancerKpis($tasks),
                'chart' => $this->activitySeries(Task::query()),
                'latestClients' => $this->latestClients(),
            ]);
        }

        $tasks = $me->tasks()->with('payments')->latest()->get();

        return Inertia::render('Dashboard', [
            'role' => 'client',
            'tasks' => $this->presentTasks($tasks),
            'stats' => $this->stats($tasks, $unreadMessages),
            'kpis' => $this->clientKpis($tasks),
            'chart' => $this->activitySeries($me->tasks()),
            'latestClients' => [],
        ]);
    }

    private function presentTasks(Collection $tasks): Collection
    {
        return $tasks->map(function (Task $task) {
            $task->is_paid = $task->payments->where('status', 'completed')->isNotEmpty();
            $task->pending_payment = $task->payments->where('status', 'pending')->isNotEmpty();
            $task->deliverable_url = $task->deliverable_file
                ? Storage::url($task->deliverable_file)
                : null;

            return $task;
        });
    }

    private function stats(Collection $tasks, int $unreadMessages): array
    {
        return [
            'open' => $tasks->where('status', 'open')->count(),
            'in_progress' => $tasks->whereIn('status', ['in_progress', 'delivered'])->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'unread_messages' => $unreadMessages,
        ];
    }

    /**
     * The four headline KPI cards for the freelancer, with real month-over-month trends.
     */
    private function freelancerKpis(Collection $tasks): array
    {
        $now = Carbon::now();
        $thisMonth = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->sum('amount');
        $lastMonth = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$now->copy()->subMonthNoOverflow()->startOfMonth(), $now->copy()->subMonthNoOverflow()->endOfMonth()])
            ->sum('amount');

        $accepted = $tasks->whereIn('status', ['in_progress', 'delivered', 'completed'])->count();

        // On-time delivery %: of delivered/completed tasks that had a deadline.
        $withDeadline = $tasks->whereIn('status', ['delivered', 'completed'])
            ->filter(fn (Task $t) => $t->deadline && $t->delivered_at);
        $onTime = $withDeadline->filter(fn (Task $t) => $t->delivered_at->lte($t->deadline->endOfDay()))->count();
        $onTimePct = $withDeadline->count() ? round($onTime / $withDeadline->count() * 100) : null;

        return [
            'revenue' => round((float) $thisMonth, 2),
            'revenue_trend' => $this->trend($thisMonth, $lastMonth),
            'accepted' => $accepted,
            'open' => $tasks->where('status', 'open')->count(),
            'on_time_pct' => $onTimePct,
            'clients' => User::where('role', 'client')->count(),
            'currency' => config('services.paypal.currency', 'USD'),
        ];
    }

    private function clientKpis(Collection $tasks): array
    {
        $spent = Payment::where('status', 'completed')
            ->whereIn('task_id', $tasks->pluck('id'))
            ->sum('amount');

        return [
            'spent' => round((float) $spent, 2),
            'active' => $tasks->whereIn('status', ['open', 'in_progress', 'delivered'])->count(),
            'delivered' => $tasks->where('status', 'delivered')->count(),
            'completed' => $tasks->where('status', 'completed')->count(),
            'currency' => config('services.paypal.currency', 'USD'),
        ];
    }

    /**
     * Percentage change, or null when there's no baseline to compare against.
     */
    private function trend(float $current, float $previous): ?float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : null;
        }

        return round(($current - $previous) / $previous * 100, 1);
    }

    /**
     * Task-activity time series for the "Task Progress" chart, at three grains.
     * $query is a Task query scoped to whoever is viewing (all, or one client's).
     *
     * @return array{daily:array, weekly:array, monthly:array}
     */
    private function activitySeries($query): array
    {
        $rows = (clone $query)
            ->where('created_at', '>=', Carbon::now()->subMonths(6)->startOfDay())
            ->get(['created_at']);

        return [
            'daily' => $this->bucket($rows, 14, 'day', 'M j'),
            'weekly' => $this->bucket($rows, 8, 'week', '\WW'),
            'monthly' => $this->bucket($rows, 6, 'month', 'M'),
        ];
    }

    /**
     * Count rows into the last $count periods of the given unit.
     *
     * @return array<int, array{label:string, value:int}>
     */
    private function bucket(Collection $rows, int $count, string $unit, string $format): array
    {
        $series = [];
        $cursor = Carbon::now();

        for ($i = $count - 1; $i >= 0; $i--) {
            $start = $cursor->copy()->sub($unit, $i)->{'startOf'.ucfirst($unit)}();
            $end = $start->copy()->{'endOf'.ucfirst($unit)}();

            $series[] = [
                'label' => $start->format($format),
                'value' => $rows->filter(fn ($r) => $r->created_at->betweenIncluded($start, $end))->count(),
            ];
        }

        return $series;
    }

    /**
     * Most recent clients with their latest task + payment state, for the
     * "Latest Clients" panel (freelancer view).
     */
    private function latestClients(): array
    {
        return Task::with(['user:id,name,email', 'payments'])
            ->latest()
            ->get()
            ->unique('user_id')
            ->take(5)
            ->map(fn (Task $t) => [
                'id' => $t->user?->id,
                'name' => $t->user?->name,
                'task' => $t->title,
                'paid' => $t->payments->where('status', 'completed')->isNotEmpty(),
            ])
            ->values()
            ->all();
    }
}
