<?php

namespace App\Http\Controllers;

use App\Models\Testimonial;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dedicated review-moderation page for the freelancer (moved out of Manage CV
 * so notifications can deep-link and scroll to a specific review).
 */
class ReviewModerationController extends Controller
{
    public function index(): Response
    {
        $reviews = Testimonial::with('user:id,name')
            ->latest()
            ->get(['id', 'user_id', 'rating', 'body', 'role_title', 'approved', 'created_at']);

        return Inertia::render('Reviews', ['reviews' => $reviews]);
    }
}
