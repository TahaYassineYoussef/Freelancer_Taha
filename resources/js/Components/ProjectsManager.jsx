import { router } from '@inertiajs/react';
import { useState } from 'react';

const inputCls =
    'w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold';

const EMPTY = { title: '', description: '', tech_stack: '', live_url: '', github_url: '', image: null, video: null };

function ProjectForm({ initial, onSubmit, onCancel, submitLabel, existingImage, existingVideo, errors = {}, processing, progress }) {
    const [values, setValues] = useState(initial);
    const set = (k, v) => setValues((s) => ({ ...s, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        onSubmit(values);
    };

    const errorList = Object.values(errors);

    return (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-white/10 bg-ink-800 p-4">
            {errorList.length > 0 && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                    {errorList.map((msg, i) => (
                        <p key={i}>• {msg}</p>
                    ))}
                </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-gray-400">Title</span>
                    <input value={values.title} onChange={(e) => set('title', e.target.value)} className={inputCls} />
                </label>
                <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-gray-400">Description</span>
                    <textarea rows={3} value={values.description ?? ''} onChange={(e) => set('description', e.target.value)} className={inputCls} />
                </label>
                <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-gray-400">Tech stack (comma separated)</span>
                    <input value={values.tech_stack ?? ''} onChange={(e) => set('tech_stack', e.target.value)} className={inputCls} placeholder="Laravel, React, MySQL" />
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-400">Live URL</span>
                    <input value={values.live_url ?? ''} onChange={(e) => set('live_url', e.target.value)} className={inputCls} placeholder="https://…" />
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-400">GitHub URL</span>
                    <input value={values.github_url ?? ''} onChange={(e) => set('github_url', e.target.value)} className={inputCls} placeholder="https://github.com/…" />
                </label>
                <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-gray-400">Screenshot / image</span>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => set('image', e.target.files[0] ?? null)}
                        className="block w-full text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-ink hover:file:bg-gold-300"
                    />
                    {existingImage && !values.image && (
                        <img src={existingImage} alt="" className="mt-2 h-20 rounded-lg object-cover" />
                    )}
                </label>
                <label className="block sm:col-span-2">
                    <span className="mb-1 block text-xs font-medium text-gray-400">Demo video (mp4/webm, up to 300&nbsp;MB). For bigger clips, paste a YouTube link in Live URL instead.</span>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => set('video', e.target.files[0] ?? null)}
                        className="block w-full text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-ink hover:file:bg-gold-300"
                    />
                    {existingVideo && !values.video && (
                        <video src={existingVideo} controls className="mt-2 h-24 rounded-lg" />
                    )}
                </label>
            </div>
            {processing && progress != null && (
                <div>
                    <div className="mb-1 flex justify-between text-xs text-gray-400">
                        <span>Uploading…</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600 transition-[width] duration-150"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                <button type="submit" disabled={processing} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-300 disabled:opacity-60">
                    {processing ? 'Uploading…' : submitLabel}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="rounded-full border border-white/15 px-5 py-2 text-sm text-gray-300 hover:text-white">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

export default function ProjectsManager({ projects }) {
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(null);

    const uploadOptions = (onOk) => ({
        preserveScroll: true,
        forceFormData: true,
        onStart: () => {
            setProcessing(true);
            setProgress(0);
        },
        onProgress: (event) => {
            if (event?.percentage != null) setProgress(Math.round(event.percentage));
        },
        onSuccess: () => {
            onOk();
            setErrors({});
        },
        onError: (e) => setErrors(e),
        onFinish: () => {
            setProcessing(false);
            setProgress(null);
        },
    });

    const create = (values) => {
        router.post(route('cv.projects.store'), values, uploadOptions(() => setAdding(false)));
    };

    const update = (id, values) => {
        // Route is POST (multipart-friendly); no method spoofing needed.
        router.post(route('cv.projects.update', id), values, uploadOptions(() => setEditingId(null)));
    };

    const remove = (id) => {
        if (confirm('Delete this project?')) {
            router.delete(route('cv.projects.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <section className="rounded-2xl border border-white/5 bg-ink-700 p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Projects</h2>
                <button
                    onClick={() => {
                        setAdding((a) => !a);
                        setEditingId(null);
                    }}
                    className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-300"
                >
                    {adding ? 'Close' : '+ Add'}
                </button>
            </div>

            {adding && (
                <div className="mb-5">
                    <ProjectForm
                        initial={{ ...EMPTY }}
                        onSubmit={create}
                        onCancel={() => { setAdding(false); setErrors({}); }}
                        submitLabel="Save"
                        errors={errors}
                        processing={processing}
                        progress={progress}
                    />
                </div>
            )}

            <div className="space-y-3">
                {projects.length === 0 && <p className="text-sm text-gray-500">No projects yet.</p>}
                {projects.map((p) =>
                    editingId === p.id ? (
                        <ProjectForm
                            key={p.id}
                            initial={{
                                title: p.title ?? '',
                                description: p.description ?? '',
                                tech_stack: p.tech_stack ?? '',
                                live_url: p.live_url ?? '',
                                github_url: p.github_url ?? '',
                                image: null,
                                video: null,
                            }}
                            existingImage={p.image_url}
                            existingVideo={p.video_url}
                            onSubmit={(values) => update(p.id, values)}
                            onCancel={() => { setEditingId(null); setErrors({}); }}
                            submitLabel="Update"
                            errors={errors}
                            processing={processing}
                            progress={progress}
                        />
                    ) : (
                        <div key={p.id} className="flex items-start gap-4 rounded-xl border border-white/5 bg-ink-800 p-4">
                            {p.image_url ? (
                                <img src={p.image_url} alt="" className="h-16 w-24 flex-shrink-0 rounded-lg object-cover" />
                            ) : (
                                <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-ink text-xs text-gray-600">
                                    No image
                                </div>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white">
                                    {p.title}
                                    {p.video_url && <span className="ml-2 text-xs text-gold">🎬 video</span>}
                                </p>
                                {p.tech_stack && <p className="text-xs text-gold">{p.tech_stack}</p>}
                                {p.description && <p className="mt-1 line-clamp-2 text-sm text-gray-400">{p.description}</p>}
                            </div>
                            <div className="flex flex-shrink-0 gap-3 text-sm">
                                <button onClick={() => { setEditingId(p.id); setAdding(false); }} className="text-gold hover:text-gold-300">
                                    Edit
                                </button>
                                <button onClick={() => remove(p.id)} className="text-red-400 hover:text-red-300">
                                    Delete
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </section>
    );
}
