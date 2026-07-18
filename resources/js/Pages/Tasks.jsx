import PanelLayout from '@/Layouts/PanelLayout';
import DeliverIcon from '@/Components/DeliverIcon';
import useNotifFlash from '@/useNotifFlash';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const STATUS = {
    open: { label: 'New', cls: 'bg-blue-500/15 text-blue-300' },
    in_progress: { label: 'In Progress', cls: 'bg-gold/15 text-gold' },
    delivered: { label: 'Delivered', cls: 'bg-purple-500/15 text-purple-300' },
    completed: { label: 'Completed', cls: 'bg-green-500/15 text-green-300' },
    declined: { label: 'Declined', cls: 'bg-red-500/15 text-red-300' },
};

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'New' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'completed', label: 'Completed' },
    { key: 'declined', label: 'Declined' },
];

function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Tasks({ tasks, counts }) {
    const page = usePage();
    const initial = new URLSearchParams(page.url.split('?')[1] || '').get('status');
    const [filter, setFilter] = useState(FILTERS.some((f) => f.key === initial) ? initial : 'all');
    const [q, setQ] = useState('');

    useNotifFlash('board');

    const visible = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return tasks.filter((t) => {
            if (filter !== 'all' && t.status !== filter) return false;
            if (!needle) return true;
            return (
                t.title.toLowerCase().includes(needle) ||
                (t.description || '').toLowerCase().includes(needle) ||
                (t.client?.name || '').toLowerCase().includes(needle) ||
                (t.category || '').toLowerCase().includes(needle)
            );
        });
    }, [tasks, filter, q]);

    const act = (name, task) => router.post(route(name, task.id), {}, { preserveScroll: true });

    return (
        <PanelLayout title="Tasks">
            <Head title="Tasks" />

            {/* Filter pills */}
            <div className="mb-4 flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                    <button
                        key={f.key}
                        onClick={() => setFilter(f.key)}
                        className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                            filter === f.key ? 'bg-gold text-ink' : 'bg-ink-700 text-gray-300 hover:text-gold'
                        }`}
                    >
                        {f.label}
                        <span className={`ml-2 rounded-full px-1.5 text-xs ${filter === f.key ? 'bg-ink/20' : 'bg-white/5'}`}>
                            {counts[f.key] ?? 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search tasks by title, client, category…"
                className="mb-6 w-full max-w-md rounded-full border border-white/10 bg-ink px-5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold"
            />

            {visible.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    No tasks match this filter.
                </div>
            ) : (
                <div className="space-y-4">
                    {visible.map((task) => (
                        <div key={task.id} id={`board-${task.id}`} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-bold text-white">{task.title}</h3>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[task.status]?.cls ?? 'bg-white/10 text-gray-300'}`}>
                                            {STATUS[task.status]?.label ?? task.status}
                                        </span>
                                        {task.is_paid && <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">✓ Paid</span>}
                                    </div>
                                    {task.client && <p className="mt-1 text-sm text-gray-400">From <span className="text-gold">{task.client.name}</span> · {task.client.email}</p>}
                                    <p className="mt-3 max-w-2xl text-sm text-gray-300">{task.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                                        {task.category && <span>📂 {task.category}</span>}
                                        {task.budget && <span>💰 ${task.budget}</span>}
                                        <span>⏰ {fmtDate(task.deadline)}</span>
                                        <span>📅 posted {fmtDate(task.created_at)}</span>
                                    </div>
                                </div>

                                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                                    {task.status === 'open' && (
                                        <>
                                            <button onClick={() => act('tasks.accept', task)} className="rounded-full bg-green-500/15 px-4 py-1.5 text-sm font-semibold text-green-300 hover:bg-green-500/25">✓ Accept</button>
                                            <button onClick={() => act('tasks.decline', task)} className="rounded-full bg-red-500/15 px-4 py-1.5 text-sm font-semibold text-red-300 hover:bg-red-500/25">✕ Decline</button>
                                        </>
                                    )}
                                    {task.status === 'in_progress' && (
                                        <Link href={route('work.index', { task: task.id })} className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-ink hover:bg-gold-300"><DeliverIcon /> Deliver</Link>
                                    )}
                                    {task.client && (
                                        <Link href={route('chat.index', { with: task.client.id })} className="text-sm text-gray-400 hover:text-gold">Chat</Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PanelLayout>
    );
}
