import { router } from '@inertiajs/react';
import { useState } from 'react';

/** Freelancer's delivery form: a file (≤300MB) and/or a link + a note. */
export default function DeliverForm({ task, onDone }) {
    const [note, setNote] = useState(task.deliverable_note ?? '');
    const [link, setLink] = useState(task.deliverable_link ?? '');
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
                onSuccess: () => onDone && onDone(),
                onError: (errs) => setError(Object.values(errs)[0]),
                onFinish: () => { setBusy(false); setProgress(null); },
            }
        );
    };

    return (
        <div className="mt-4 w-full space-y-3 rounded-xl border border-purple-500/20 bg-ink-800 p-4">
            <p className="text-sm font-semibold text-white">Deliver your work</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message to the client (optional)"
                className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold" />
            <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link (GitHub, Drive, WeTransfer…) — for large deliverables"
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
                {busy ? `Sending… ${progress ?? 0}%` : 'Send delivery'}
            </button>
        </div>
    );
}
