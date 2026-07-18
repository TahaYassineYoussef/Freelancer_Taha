<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use App\Rules\CleanText;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TestimonialController extends Controller
{
    /**
     * A client leaves a review. It stays hidden until Taha approves it.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['required', 'string', 'min:10', 'max:2000', new CleanText($ctx = 'a public review a client wrote about a freelance developer')],
            'role_title' => ['nullable', 'string', 'max:255', new CleanText($ctx)],
            'task_id' => ['nullable', 'exists:tasks,id'],
        ]);

        $request->user()->testimonials()->create([
            ...$data,
            'approved' => false,
        ]);

        \App\Models\User::where('role', 'freelancer')->first()?->notify(
            new \App\Notifications\ActivityNotification(
                'review',
                'New review',
                "{$request->user()->name} left a {$data['rating']}★ review — approve it to publish.",
                route('cv.edit', ['review' => $request->user()->testimonials()->latest()->first()?->id]),
                '⭐',
            )
        );

        return back()->with('success', 'Thanks for your review! It will appear once Taha approves it.');
    }

    /**
     * The freelancer publishes or hides a review.
     */
    public function review(Request $request, Testimonial $testimonial): RedirectResponse
    {
        $data = $request->validate([
            'approved' => ['required', 'boolean'],
        ]);

        $testimonial->update($data);

        return back()->with('success', $data['approved'] ? 'Review published.' : 'Review hidden.');
    }

    /**
     * The freelancer, or the author, removes a review.
     */
    public function destroy(Testimonial $testimonial): RedirectResponse
    {
        abort_unless(
            Auth::user()->isFreelancer() || $testimonial->user_id === Auth::id(),
            403
        );

        $testimonial->delete();

        return back()->with('success', 'Review removed.');
    }
}
