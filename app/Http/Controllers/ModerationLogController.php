<?php

namespace App\Http\Controllers;

use App\Models\ModerationLog;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The freelancer's log of blocked submissions — every task/review/message that
 * the moderation layer rejected, with what the sender actually tried to post.
 */
class ModerationLogController extends Controller
{
    public function index(): Response
    {
        $logs = ModerationLog::with('user:id,name,email')
            ->latest()
            ->limit(500)
            ->get();

        return Inertia::render('ModerationLog', [
            'logs' => $logs,
            'stats' => [
                'total' => ModerationLog::count(),
                'scam' => ModerationLog::whereIn('category', ['scam', 'spam'])->count(),
                'profanity' => ModerationLog::whereIn('category', ['profanity', 'insult'])->count(),
                'by_ai' => ModerationLog::where('detected_by', 'ai')->count(),
            ],
        ]);
    }

    public function destroy(ModerationLog $moderationLog): RedirectResponse
    {
        $moderationLog->delete();

        return back()->with('success', 'Entry removed.');
    }
}
