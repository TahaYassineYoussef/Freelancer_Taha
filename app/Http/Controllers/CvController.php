<?php

namespace App\Http\Controllers;

use App\Models\Diploma;
use App\Models\Experience;
use App\Models\Internship;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CvController extends Controller
{
    public function edit(Request $request): Response
    {
        $me = $request->user()->load([
            'diplomas', 'experiences', 'internships',
            'projects', 'skills' => fn ($q) => $q->orderByDesc('level'), 'services',
        ]);

        $projects = $me->projects->map(function ($project) {
            $project->image_url = $project->image ? Storage::url($project->image) : null;
            $project->video_url = $project->video ? Storage::url($project->video) : null;

            return $project;
        });

        $testimonials = \App\Models\Testimonial::with('user:id,name')
            ->latest()
            ->get(['id', 'user_id', 'rating', 'body', 'role_title', 'approved', 'created_at']);

        return Inertia::render('Cv/Manage', [
            'profile' => $me->only(['name', 'headline', 'headline_fr', 'headline_ar', 'bio', 'bio_fr', 'bio_ar', 'location', 'phone', 'd17_number']),
            'avatarUrl' => $me->avatarUrl(),
            'd17QrUrl' => $me->d17_qr ? Storage::url($me->d17_qr) : null,
            'testimonials' => $testimonials,
            'diplomas' => $me->diplomas,
            'experiences' => $me->experiences,
            'internships' => $me->internships,
            'projects' => $projects,
            'skills' => $me->skills,
            'services' => $me->services,
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'headline' => ['nullable', 'string', 'max:255'],
            'headline_fr' => ['nullable', 'string', 'max:255'],
            'headline_ar' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string'],
            'bio_fr' => ['nullable', 'string'],
            'bio_ar' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'd17_number' => ['nullable', 'string', 'max:50'],
            'avatar' => ['nullable', 'image', 'max:4096'],
            'd17_qr' => ['nullable', 'image', 'max:4096'],
        ]);

        $user = $request->user();

        if ($request->hasFile('avatar')) {
            if ($user->avatar) {
                Storage::disk('public')->delete($user->avatar);
            }
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        } else {
            unset($data['avatar']);
        }

        if ($request->hasFile('d17_qr')) {
            if ($user->d17_qr) {
                Storage::disk('public')->delete($user->d17_qr);
            }
            $data['d17_qr'] = $request->file('d17_qr')->store('d17', 'public');
        } else {
            unset($data['d17_qr']);
        }

        $user->update($data);

        return back()->with('success', 'Profile updated.');
    }

    // ---- Diplomas ----------------------------------------------------------

    public function storeDiploma(Request $request): RedirectResponse
    {
        $request->user()->diplomas()->create($this->validateDiploma($request));

        return back()->with('success', 'Diploma added.');
    }

    public function updateDiploma(Request $request, Diploma $diploma): RedirectResponse
    {
        $this->authorizeOwner($diploma->user_id);
        $diploma->update($this->validateDiploma($request));

        return back()->with('success', 'Diploma updated.');
    }

    public function destroyDiploma(Diploma $diploma): RedirectResponse
    {
        $this->authorizeOwner($diploma->user_id);
        $diploma->delete();

        return back()->with('success', 'Diploma removed.');
    }

    // ---- Experiences -------------------------------------------------------

    public function storeExperience(Request $request): RedirectResponse
    {
        $request->user()->experiences()->create($this->validateExperience($request));

        return back()->with('success', 'Experience added.');
    }

    public function updateExperience(Request $request, Experience $experience): RedirectResponse
    {
        $this->authorizeOwner($experience->user_id);
        $experience->update($this->validateExperience($request));

        return back()->with('success', 'Experience updated.');
    }

    public function destroyExperience(Experience $experience): RedirectResponse
    {
        $this->authorizeOwner($experience->user_id);
        $experience->delete();

        return back()->with('success', 'Experience removed.');
    }

    // ---- Internships -------------------------------------------------------

    public function storeInternship(Request $request): RedirectResponse
    {
        $request->user()->internships()->create($this->validateInternship($request));

        return back()->with('success', 'Internship added.');
    }

    public function updateInternship(Request $request, Internship $internship): RedirectResponse
    {
        $this->authorizeOwner($internship->user_id);
        $internship->update($this->validateInternship($request));

        return back()->with('success', 'Internship updated.');
    }

    public function destroyInternship(Internship $internship): RedirectResponse
    {
        $this->authorizeOwner($internship->user_id);
        $internship->delete();

        return back()->with('success', 'Internship removed.');
    }

    // ---- Helpers -----------------------------------------------------------

    private function authorizeOwner(int $ownerId): void
    {
        abort_unless($ownerId === Auth::id(), 403);
    }

    private function validateDiploma(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'institution' => ['required', 'string', 'max:255'],
            'field' => ['nullable', 'string', 'max:255'],
            'start_year' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'end_year' => ['nullable', 'integer', 'min:1950', 'max:2100'],
            'description' => ['nullable', 'string'],
        ]);
    }

    private function validateExperience(Request $request): array
    {
        return $request->validate([
            'company' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_current' => ['boolean'],
            'description' => ['nullable', 'string'],
        ]);
    }

    private function validateInternship(Request $request): array
    {
        return $request->validate([
            'company' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'description' => ['nullable', 'string'],
        ]);
    }
}
