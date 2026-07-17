import { router } from '@inertiajs/react';
import { useState } from 'react';

/** In-app modal for a client to request changes on a delivered task. */
export default function RequestChangesModal({ task, onClose }) {
    const [note, setNote] = useState('');
    const [busy, setBusy] = useState(false);

    const submit = () => {
        setBusy(true);
        router.post(route('tasks.requestChanges', task.id), { note }, {
            preserveScroll: true,
            onSuccess: onClose,
            onFinish: () => setBusy(false),
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
            <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-800 p-6" onClick={(e) => e.stopPropagation()}>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white">Request changes</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                </div>
                <p className="mb-3 text-sm text-gray-400">
                    Tell Taha what to adjust on <span className="text-gold">“{task.title}”</span>. He'll get it back to “in progress”.
                </p>
                <textarea
                    autoFocus
                    rows={5}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Describe the changes you'd like… (e.g. the header color, missing contact form, a bug on mobile)"
                    className="w-full rounded-lg border border-white/10 bg-ink px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold"
                />
                <div className="mt-4 flex justify-end gap-3">
                    <button onClick={onClose} className="rounded-full border border-white/15 px-5 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
                    <button onClick={submit} disabled={busy} className="rounded-full bg-gold px-6 py-2 text-sm font-bold text-ink hover:bg-gold-300 disabled:opacity-60">
                        {busy ? 'Sending…' : 'Send request'}
                    </button>
                </div>
            </div>
        </div>
    );
}
