<?php

namespace App\Http\Controllers;

use App\Models\Visit;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Website traffic for the freelancer: how many people visit, how many are brand
 * new vs returning, where they come from and what they look at.
 */
class VisitorController extends Controller
{
    public function index(): Response
    {
        $today = Carbon::today();
        $since = Carbon::today()->subDays(29);

        // One pass over the last 30 days; small enough to aggregate in PHP and
        // keeps the queries database-agnostic.
        $recent = Visit::where('created_at', '>=', $since)
            ->get(['visitor_id', 'is_new', 'path', 'referrer', 'device', 'browser', 'created_at']);

        $todayVisits = $recent->filter(fn ($v) => $v->created_at->gte($today));

        return Inertia::render('Visitors', [
            'kpis' => [
                'online' => Visit::where('created_at', '>=', Carbon::now()->subMinutes(5))
                    ->distinct('visitor_id')->count('visitor_id'),
                'today_views' => $todayVisits->count(),
                'today_visitors' => $todayVisits->pluck('visitor_id')->unique()->count(),
                'today_new' => $todayVisits->where('is_new', true)->pluck('visitor_id')->unique()->count(),
                'today_returning' => $todayVisits->where('is_new', false)->pluck('visitor_id')->unique()->count(),
                'month_views' => $recent->count(),
                'month_visitors' => $recent->pluck('visitor_id')->unique()->count(),
                'total_views' => Visit::count(),
            ],
            'chart' => $this->series(),
            'topPages' => $this->top($recent, 'path'),
            'topReferrers' => $this->top($recent->filter(fn ($v) => $v->referrer), 'referrer'),
            'devices' => $this->top($recent, 'device', 5),
            'browsers' => $this->top($recent, 'browser', 5),
            'latest' => Visit::latest()->limit(15)->get(['id', 'path', 'referrer', 'device', 'browser', 'is_new', 'created_at'])
                ->map(fn (Visit $v) => [
                    'id' => $v->id,
                    'path' => $v->path,
                    'referrer' => $v->referrer,
                    'device' => $v->device,
                    'browser' => $v->browser,
                    'is_new' => $v->is_new,
                    'when' => $v->created_at->diffForHumans(),
                ]),
        ]);
    }

    /**
     * Page views over time, in the {daily, weekly, monthly} shape the shared
     * LineChart component expects.
     */
    private function series(): array
    {
        $rows = Visit::where('created_at', '>=', Carbon::today()->subMonths(12))
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
            'monthly' => $bucket(12, 'month', 'M', fn ($i) => Carbon::today()->startOfMonth()->subMonths($i)),
        ];
    }

    /**
     * Most common values of a column, as [{label, count}].
     */
    private function top(Collection $rows, string $column, int $limit = 8): array
    {
        return $rows->groupBy($column)
            ->map->count()
            ->sortDesc()
            ->take($limit)
            ->map(fn ($count, $label) => ['label' => (string) $label, 'count' => $count])
            ->values()
            ->all();
    }
}
