<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Task;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * The freelancer's own console: the numbers and queues that live in the web
 * sidebar (Dashboard, Get Paid, Revisions, Reviews), served to the mobile app.
 *
 * Every action asserts the freelancer role — these are admin surfaces.
 */
class FreelancerController extends Controller
{
    // ---- Dashboard ---------------------------------------------------------

    public function dashboard(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $tasks = Task::with(['user:id,name,email', 'payments'])->latest()->get();

        return response()->json([
            'kpis' => $this->kpis($tasks),
            'counts' => [
                'open' => $tasks->where('status', 'open')->count(),
                'in_progress' => $tasks->where('status', 'in_progress')->count(),
                'delivered' => $tasks->where('status', 'delivered')->count(),
                'completed' => $tasks->where('status', 'completed')->count(),
                'declined' => $tasks->where('status', 'declined')->count(),
                'revisions' => Task::whereNotNull('revision_note')->where('status', 'in_progress')->count(),
                'pending_payments' => Payment::where('status', 'pending')->count(),
                'pending_reviews' => Testimonial::where('approved', false)->count(),
            ],
            'latest_clients' => $this->latestClients(),
            // Task activity for the dashboard chart, matching the web's series.
            'chart' => $this->series(Task::query()),
        ]);
    }

    /**
     * Rows bucketed for a small chart: last 14 days, 8 weeks and 6 months.
     *
     * @return array<string, array<int, array{label:string, value:int}>>
     */
    private function series($query): array
    {
        $rows = (clone $query)
            ->where('created_at', '>=', Carbon::now()->subMonths(6)->startOfDay())
            ->get(['created_at']);

        $bucket = function (int $count, string $unit, string $format, callable $start) use ($rows) {
            $out = [];
            for ($i = $count - 1; $i >= 0; $i--) {
                $from = $start($i);
                $to = (clone $from)->add($unit, 1);
                $out[] = [
                    'label' => $from->format($format),
                    'value' => $rows->filter(fn ($r) => $r->created_at->gte($from) && $r->created_at->lt($to))->count(),
                ];
            }

            return $out;
        };

        return [
            'daily' => $bucket(14, 'day', 'M j', fn ($i) => Carbon::today()->subDays($i)),
            'weekly' => $bucket(8, 'week', 'M j', fn ($i) => Carbon::today()->startOfWeek()->subWeeks($i)),
            'monthly' => $bucket(6, 'month', 'M', fn ($i) => Carbon::today()->startOfMonth()->subMonths($i)),
        ];
    }

    /**
     * Mirrors DashboardController::freelancerKpis so both surfaces agree.
     */
    private function kpis($tasks): array
    {
        $now = Carbon::now();
        $thisMonth = Payment::where('status', 'completed')
            ->whereBetween('created_at', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->sum('amount');

        $withDeadline = $tasks->whereIn('status', ['delivered', 'completed'])
            ->filter(fn (Task $t) => $t->deadline && $t->delivered_at);
        $onTime = $withDeadline->filter(fn (Task $t) => $t->delivered_at->lte($t->deadline->endOfDay()))->count();

        return [
            'revenue' => round((float) $thisMonth, 2),
            'currency' => config('services.paypal.currency', 'USD'),
            'accepted' => $tasks->whereIn('status', ['in_progress', 'delivered', 'completed'])->count(),
            'on_time_pct' => $withDeadline->count() ? (int) round($onTime / $withDeadline->count() * 100) : null,
            'clients' => User::where('role', 'client')->count(),
        ];
    }

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

    // ---- Get Paid ----------------------------------------------------------

    public function payments(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $payments = Payment::with(['task:id,title,budget,status', 'user:id,name,email'])
            ->latest()
            ->get();

        $completed = $payments->where('status', 'completed');

        return response()->json([
            'payments' => $payments->map(fn (Payment $p) => [
                'id' => $p->id,
                'amount' => $p->amount,
                'currency' => $p->currency,
                'provider' => $p->provider,
                'status' => $p->status,
                'reference' => $p->provider_order_id,
                'created_at' => $p->created_at?->toIso8601String(),
                'task' => $p->task ? ['id' => $p->task->id, 'title' => $p->task->title] : null,
                'client' => $p->user ? ['name' => $p->user->name, 'email' => $p->user->email] : null,
            ])->values(),
            'stats' => [
                'total_received' => round((float) $completed->sum('amount'), 2),
                'completed_count' => $completed->count(),
                'pending_count' => $payments->where('status', 'pending')->count(),
                'currency' => config('services.paypal.currency', 'USD'),
            ],
        ]);
    }

    /** Confirm or reject a declared (D17) payment. */
    public function reviewPayment(Request $request, Payment $payment): JsonResponse
    {
        $this->assertFreelancer($request);

        $data = $request->validate([
            'status' => ['required', Rule::in(['completed', 'failed'])],
        ]);

        $payment->update($data);

        return response()->json([
            'payment' => ['id' => $payment->id, 'status' => $payment->status],
            'message' => $data['status'] === 'completed' ? 'Payment confirmed.' : 'Payment rejected.',
        ]);
    }

    // ---- Revisions ---------------------------------------------------------

    /** Change requests waiting on a re-delivery. */
    public function revisions(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $tasks = Task::with('user:id,name,email')
            ->whereNotNull('revision_note')
            ->where('status', 'in_progress')
            ->latest('updated_at')
            ->get();

        return response()->json([
            'revisions' => $tasks->map(fn (Task $t) => [
                'id' => $t->id,
                'title' => $t->title,
                'revision_note' => $t->revision_note,
                'deadline' => $t->deadline?->toDateString(),
                'budget' => $t->budget,
                'client' => $t->user?->name,
                'previous_note' => $t->deliverable_note,
                'previous_link' => $t->deliverable_link,
                'previous_file' => $t->deliverable_file ? url(Storage::url($t->deliverable_file)) : null,
            ])->values(),
        ]);
    }

    // ---- Review moderation -------------------------------------------------

    public function reviews(Request $request): JsonResponse
    {
        $this->assertFreelancer($request);

        $reviews = Testimonial::with('user:id,name')->latest()->get();

        return response()->json([
            'reviews' => $reviews->map(fn (Testimonial $t) => [
                'id' => $t->id,
                'rating' => $t->rating,
                'body' => $t->body,
                'role_title' => $t->role_title,
                'approved' => $t->approved,
                'author' => $t->user?->name,
                'created_at' => $t->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    /** Publish or hide a review. */
    public function moderateReview(Request $request, Testimonial $testimonial): JsonResponse
    {
        $this->assertFreelancer($request);

        $data = $request->validate([
            'approved' => ['required', 'boolean'],
        ]);

        $testimonial->update($data);

        return response()->json([
            'review' => ['id' => $testimonial->id, 'approved' => $testimonial->approved],
            'message' => $data['approved'] ? 'Review published.' : 'Review hidden.',
        ]);
    }

    // ---- Helpers -----------------------------------------------------------

    private function assertFreelancer(Request $request): void
    {
        abort_unless($request->user()?->isFreelancer(), 403);
    }
}
