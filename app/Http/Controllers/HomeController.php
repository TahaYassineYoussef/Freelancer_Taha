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

        return Inertia::render('Home', [
            'freelancer' => $freelancer,
        ]);
    }
}
