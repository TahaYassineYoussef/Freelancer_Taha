import PanelLayout from '@/Layouts/PanelLayout';
import RequestChangesModal from '@/Components/RequestChangesModal';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Deliveries({ tasks }) {
    const page = usePage();
    const [changeTask, setChangeTask] = useState(null);
    const [highlight, setHighlight] = useState(null);

    useEffect(() => {
        const id = new URLSearchParams(page.url.split('?')[1] || '').get('task');
        if (!id) return;
        const el = document.getElementById(`delivery-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlight(Number(id));
            const t = setTimeout(() => setHighlight(null), 2600);
            return () => clearTimeout(t);
        }
    }, [page.url]);

    const approve = (task) => router.post(route('tasks.approve', task.id), {}, { preserveScroll: true });

    const pending = tasks.filter((t) => t.status === 'delivered');

    return (
        <PanelLayout title="Deliveries">
            <Head title="Deliveries" />

            <p className="mb-6 max-w-2xl text-sm text-gray-400">
                Work Taha has delivered to you. Review each delivery, then <span className="text-green-300">approve</span> it
                or <span className="text-gray-200">request changes</span>.
            </p>

            {tasks.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    No deliveries yet. When Taha delivers a task, it shows up here.
                </div>
            ) : (
                <div className="space-y-4">
                    {pending.length > 0 && (
                        <h2 className="text-sm font-bold uppercase tracking-wide text-purple-300">Awaiting your approval</h2>
                    )}
                    {tasks.map((task) => {
                        const done = task.status === 'completed';
                        return (
                            <div
                                key={task.id}
                                id={`delivery-${task.id}`}
                                className={`rounded-2xl border bg-ink-700 p-6 transition ${
                                    highlight === task.id ? 'animate-pulse border-gold ring-4 ring-gold/60' : done ? 'border-white/5' : 'border-purple-500/20'
                                }`}
                            >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h3 className="text-lg font-bold text-white">{task.title}</h3>
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${done ? 'bg-green-500/15 text-green-300' : 'bg-purple-500/15 text-purple-300'}`}>
                                                {done ? '✓ Completed' : 'Delivered'}
                                            </span>
                                        </div>

                                        <div className="mt-4 rounded-xl border border-white/10 bg-ink-800 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">📦 Delivery</p>
                                            {task.note && <p className="mt-2 text-sm text-gray-300">{task.note}</p>}
                                            <div className="mt-3 flex flex-wrap gap-3">
                                                {task.file && (
                                                    <a href={task.file} target="_blank" rel="noreferrer" download className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-300">⬇ Download file</a>
                                                )}
                                                {task.link && (
                                                    <a href={task.link} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:border-gold hover:text-gold">🔗 Open link</a>
                                                )}
                                                {!task.file && !task.link && <span className="text-sm text-gray-500">No attachment — see the message above.</span>}
                                            </div>
                                            {task.delivered_at && <p className="mt-2 text-[11px] text-gray-500">Delivered {fmtDate(task.delivered_at)}</p>}
                                        </div>
                                    </div>

                                    {!done && (
                                        <div className="flex flex-shrink-0 flex-col items-end gap-2">
                                            <button onClick={() => approve(task)} className="rounded-full bg-green-500/15 px-5 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/25">✓ Approve</button>
                                            <button onClick={() => setChangeTask(task)} className="rounded-full bg-white/5 px-5 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10">🔁 Request changes</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {changeTask && <RequestChangesModal task={changeTask} onClose={() => setChangeTask(null)} />}

            <div className="mt-6">
                <Link href={route('chat.index')} className="text-sm text-gold hover:text-gold-300">Message Taha about a delivery →</Link>
            </div>
        </PanelLayout>
    );
}
