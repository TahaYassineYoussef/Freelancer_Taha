<?php

namespace App\Http\Controllers;

use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(): Response
    {
        $freelancer = User::where('role', 'freelancer')
            ->with([
                'diplomas' => fn ($q) => $q->orderByDesc('end_year'),
                'experiences' => fn ($q) => $q->orderByDesc('is_current')->orderByDesc('start_date'),
                'internships' => fn ($q) => $q->orderByDesc('start_date'),
                'projects' => fn ($q) => $q->latest(),
                'skills' => fn ($q) => $q->orderByDesc('level'),
                'services' => fn ($q) => $q->orderBy('id'),
            ])
            ->first();

        if ($freelancer) {
            // Show the headline/bio in the visitor's language (fall back to English).
            $locale = app()->getLocale();
            if ($locale === 'fr') {
                $freelancer->headline = $freelancer->headline_fr ?: $freelancer->headline;
                $freelancer->bio = $freelancer->bio_fr ?: $freelancer->bio;
            } elseif ($locale === 'ar') {
                $freelancer->headline = $freelancer->headline_ar ?: $freelancer->headline;
                $freelancer->bio = $freelancer->bio_ar ?: $freelancer->bio;
            }

            $freelancer->avatar_url = $freelancer->avatarUrl();
            $freelancer->projects->each(function ($project) {
                $project->image_url = $project->image
                    ? \Illuminate\Support\Facades\Storage::url($project->image)
                    : null;
                $project->video_url = $project->video
                    ? \Illuminate\Support\Facades\Storage::url($project->video)
                    : null;
            });
        }

        $testimonials = \App\Models\Testimonial::approved()
            ->with('user:id,name')
            ->latest()
            ->get(['id', 'user_id', 'rating', 'body', 'role_title', 'created_at']);

        return Inertia::render('Home', [
            'freelancer' => $freelancer,
            'testimonials' => $testimonials,
        ]);
    }
}
