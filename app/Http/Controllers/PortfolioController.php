<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Service;
use App\Models\Skill;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PortfolioController extends Controller
{
    // ---- Projects ----------------------------------------------------------

    public function storeProject(Request $request): RedirectResponse
    {
        $data = $this->validateProject($request);
        $data['image'] = $this->handleUpload($request, 'image', 'projects/images', null);
        $data['video'] = $this->handleUpload($request, 'video', 'projects/videos', null);
        $request->user()->projects()->create($data);

        return back()->with('success', 'Project added.');
    }

    public function updateProject(Request $request, Project $project): RedirectResponse
    {
        $this->authorizeOwner($project->user_id);
        $data = $this->validateProject($request);
        $data['image'] = $this->handleUpload($request, 'image', 'projects/images', $project->image);
        $data['video'] = $this->handleUpload($request, 'video', 'projects/videos', $project->video);
        $project->update($data);

        return back()->with('success', 'Project updated.');
    }

    public function destroyProject(Project $project): RedirectResponse
    {
        $this->authorizeOwner($project->user_id);
        $this->deleteFile($project->image);
        $this->deleteFile($project->video);
        $project->delete();

        return back()->with('success', 'Project removed.');
    }

    // ---- Skills ------------------------------------------------------------

    public function storeSkill(Request $request): RedirectResponse
    {
        $request->user()->skills()->create($this->validateSkill($request));

        return back()->with('success', 'Skill added.');
    }

    public function updateSkill(Request $request, Skill $skill): RedirectResponse
    {
        $this->authorizeOwner($skill->user_id);
        $skill->update($this->validateSkill($request));

        return back()->with('success', 'Skill updated.');
    }

    public function destroySkill(Skill $skill): RedirectResponse
    {
        $this->authorizeOwner($skill->user_id);
        $skill->delete();

        return back()->with('success', 'Skill removed.');
    }

    // ---- Services ----------------------------------------------------------

    public function storeService(Request $request): RedirectResponse
    {
        $request->user()->services()->create($this->validateService($request));

        return back()->with('success', 'Service added.');
    }

    public function updateService(Request $request, Service $service): RedirectResponse
    {
        $this->authorizeOwner($service->user_id);
        $service->update($this->validateService($request));

        return back()->with('success', 'Service updated.');
    }

    public function destroyService(Service $service): RedirectResponse
    {
        $this->authorizeOwner($service->user_id);
        $service->delete();

        return back()->with('success', 'Service removed.');
    }

    // ---- Helpers -----------------------------------------------------------

    private function authorizeOwner(int $ownerId): void
    {
        abort_unless($ownerId === Auth::id(), 403);
    }

    private function handleUpload(Request $request, string $field, string $folder, ?string $current): ?string
    {
        if ($request->hasFile($field)) {
            $this->deleteFile($current);

            return $request->file($field)->store($folder, 'public');
        }

        return $current;
    }

    private function deleteFile(?string $path): void
    {
        if ($path) {
            Storage::disk('public')->delete($path);
        }
    }

    private function validateProject(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'tech_stack' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'image', 'max:4096'],
            'video' => ['nullable', 'file', 'mimetypes:video/mp4,video/webm,video/quicktime,video/x-msvideo', 'max:307200'],
            'live_url' => ['nullable', 'url', 'max:255'],
            'github_url' => ['nullable', 'url', 'max:255'],
        ]);
    }

    private function validateSkill(Request $request): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'level' => ['required', 'integer', 'min:0', 'max:100'],
        ]);
    }

    private function validateService(Request $request): array
    {
        return $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:255'],
            'price' => ['nullable', 'numeric', 'min:0'],
        ]);
    }
}
