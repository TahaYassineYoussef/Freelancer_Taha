<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Testimonial;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortfolioController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $locale = $this->locale($request);

        $f = User::where('role', 'freelancer')
            ->with([
                'diplomas' => fn ($q) => $q->orderByDesc('end_year'),
                'experiences' => fn ($q) => $q->orderByDesc('is_current')->orderByDesc('start_date'),
                'internships' => fn ($q) => $q->orderByDesc('start_date'),
                'projects' => fn ($q) => $q->latest(),
                'skills' => fn ($q) => $q->orderByDesc('level'),
                'services' => fn ($q) => $q->orderBy('id'),
            ])
            ->first();

        if (! $f) {
            return response()->json(['freelancer' => null]);
        }

        return response()->json([
            'locale' => $locale,
            'freelancer' => [
                'name' => $f->name,
                'email' => $f->email,
                // Per-language copy, falling back to the default (English) column.
                'headline' => $this->localized($f, 'headline', $locale),
                'bio' => $this->localized($f, 'bio', $locale),
                'location' => $f->location,
                'phone' => $f->phone,
                'avatar_url' => $f->avatar ? $this->url($f->avatar) : null,
                'cv_url' => url('/cv/download'),
                'testimonials' => Testimonial::approved()
                    ->with('user:id,name')
                    ->latest()
                    ->get()
                    ->map(fn (Testimonial $t) => [
                        'id' => $t->id, 'rating' => $t->rating, 'body' => $t->body,
                        'role_title' => $t->role_title, 'author' => $t->user?->name,
                        'created_at' => $t->created_at?->toIso8601String(),
                    ]),
                'skills' => $f->skills->map(fn ($s) => [
                    'id' => $s->id, 'name' => $s->name, 'level' => $s->level,
                ]),
                'services' => $f->services->map(fn ($s) => [
                    'id' => $s->id, 'title' => $s->title, 'description' => $s->description, 'price' => $s->price,
                ]),
                'experiences' => $f->experiences->map(fn ($e) => [
                    'id' => $e->id, 'position' => $e->position, 'company' => $e->company,
                    'location' => $e->location, 'description' => $e->description,
                    'start_date' => $e->start_date?->toDateString(),
                    'end_date' => $e->end_date?->toDateString(), 'is_current' => $e->is_current,
                ]),
                'internships' => $f->internships->map(fn ($i) => [
                    'id' => $i->id, 'position' => $i->position, 'company' => $i->company,
                    'location' => $i->location, 'description' => $i->description,
                    'start_date' => $i->start_date?->toDateString(),
                    'end_date' => $i->end_date?->toDateString(),
                ]),
                'diplomas' => $f->diplomas->map(fn ($d) => [
                    'id' => $d->id, 'title' => $d->title, 'institution' => $d->institution,
                    'field' => $d->field, 'start_year' => $d->start_year, 'end_year' => $d->end_year,
                    'description' => $d->description,
                ]),
                'projects' => $f->projects->map(fn ($p) => [
                    'id' => $p->id, 'title' => $p->title, 'description' => $p->description,
                    'tech_stack' => $p->tech_stack, 'live_url' => $p->live_url, 'github_url' => $p->github_url,
                    'image_url' => $p->image ? $this->url($p->image) : null,
                    'video_url' => $p->video ? $this->url($p->video) : null,
                ]),
            ],
        ]);
    }

    private function url(string $path): string
    {
        return url(Storage::url($path));
    }

    /**
     * Locale requested by the app: `?locale=fr`, else the Accept-Language
     * header, else the app default. Only en/fr/ar are supported.
     */
    private function locale(Request $request): string
    {
        $wanted = $request->query('locale')
            ?: substr((string) $request->header('Accept-Language'), 0, 2);

        return in_array($wanted, ['en', 'fr', 'ar'], true) ? $wanted : 'en';
    }

    /**
     * `headline_fr` / `bio_ar` … falling back to the base column when the
     * translation is empty, mirroring HomeController.
     */
    private function localized(User $f, string $field, string $locale): ?string
    {
        if ($locale === 'en') {
            return $f->{$field};
        }

        return $f->{"{$field}_{$locale}"} ?: $f->{$field};
    }
}
