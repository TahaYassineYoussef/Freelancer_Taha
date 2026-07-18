import PanelLayout from '@/Layouts/PanelLayout';
import DeliverIcon from '@/Components/DeliverIcon';
import useNotifFlash from '@/useNotifFlash';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Inline re-delivery form (same as the dashboard one). */
function RedeliverForm({ task, onDone }) {
    const [note, setNote] = useState('');
    const [link, setLink] = useState(task.previous_link ?? '');
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(null);
    const [busy, setBusy] = useState(false);

    const submit = () => {
        setBusy(true);
        setError(null);
        router.post(
            route('tasks.deliver', task.id),
            { deliverable_note: note, deliverable_link: link, deliverable_file: file },
            {
                preserveScroll: true,
                forceFormData: true,
                onProgress: (e) => e?.percentage != null && setProgress(Math.round(e.percentage)),
                onSuccess: onDone,
                onError: (errs) => setError(Object.values(errs)[0]),
                onFinish: () => { setBusy(false); setProgress(null); },
            }
        );
    };

    return (
        <div className="mt-4 space-y-3 rounded-xl border border-purple-500/20 bg-ink-800 p-4">
            {error && <p className="text-sm text-red-400">{error}</p>}
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message about the fix (optional)"
                className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold" />
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (GitHub, Drive, WeTransfer…)"
                className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold" />
            <label className="block text-xs text-gray-400">
                or upload a file (up to 300&nbsp;MB)
                <input type="file" onChange={(e) => setFile(e.target.files[0] ?? null)}
                    className="mt-1 block w-full text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-ink hover:file:bg-gold-300" />
            </label>
            {busy && progress != null && (
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${progress}%` }} />
                </div>
            )}
            <button onClick={submit} disabled={busy} className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink hover:bg-gold-300 disabled:opacity-60">
                {busy ? `Sending… ${progress ?? 0}%` : 'Re-deliver'}
            </button>
        </div>
    );
}

export default function Revisions({ tasks }) {
    const [open, setOpen] = useState(null);

    useNotifFlash('revision');

    return (
        <PanelLayout title="Change requests">
            <Head title="Revisions" />

            <p className="mb-6 max-w-2xl text-sm text-gray-400">
                Tasks where a client asked for changes on your delivery. Fix them and re-deliver — each one
                disappears from here once you send the new version.
            </p>

            {tasks.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    🎉 No pending change requests. You're all caught up.
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            id={`revision-${task.id}`}
                            className="rounded-2xl border border-amber-500/20 bg-ink-700 p-6"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-bold text-white">{task.title}</h3>
                                        <span className="rounded-full bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-300">Needs changes</span>
                                    </div>
                                    {task.client && (
                                        <p className="mt-1 text-sm text-gray-400">
                                            From <span className="text-gold">{task.client.name}</span> · {task.client.email}
                                        </p>
                                    )}

                                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">🔁 What the client wants changed</p>
                                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-200">{task.revision_note}</p>
                                    </div>

                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                                        {task.budget && <span>💰 ${task.budget}</span>}
                                        <span>⏰ Deadline: {fmtDate(task.deadline)}</span>
                                        {task.previous_file && (
                                            <a href={task.previous_file} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-300">⬇ Your previous file</a>
                                        )}
                                        {task.previous_link && (
                                            <a href={task.previous_link} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-300">🔗 Your previous link</a>
                                        )}
                                    </div>

                                    {open === task.id && <RedeliverForm task={task} onDone={() => setOpen(null)} />}
                                </div>

                                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                                    {open === task.id ? (
                                        <button onClick={() => setOpen(null)} className="text-sm text-gray-400 hover:text-white">Cancel</button>
                                    ) : (
                                        <button onClick={() => setOpen(task.id)} className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold-300"><DeliverIcon /> Re-deliver</button>
                                    )}
                                    <Link href={route('chat.index', { with: task.client?.id })} className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:border-gold hover:text-gold">
                                        Chat client
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PanelLayout>
    );
}
