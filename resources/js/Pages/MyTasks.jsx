import PanelLayout from '@/Layouts/PanelLayout';
import PayPalButton from '@/Components/PayPalButton';
import D17Button from '@/Components/D17Button';
import RequestChangesModal from '@/Components/RequestChangesModal';
import useNotifFlash from '@/useNotifFlash';
import { useT } from '@/i18n';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const STATUS = {
    open: { label: 'Open', cls: 'bg-blue-500/15 text-blue-300' },
    in_progress: { label: 'In Progress', cls: 'bg-gold/15 text-gold' },
    delivered: { label: 'Delivered', cls: 'bg-purple-500/15 text-purple-300' },
    completed: { label: 'Completed', cls: 'bg-green-500/15 text-green-300' },
    declined: { label: 'Declined', cls: 'bg-red-500/15 text-red-300' },
};

const FILTERS = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'completed', label: 'Completed' },
    { key: 'declined', label: 'Declined' },
];

function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyTasks({ tasks, counts }) {
    const page = usePage();
    const { paypal, d17 } = page.props;
    const initial = new URLSearchParams(page.url.split('?')[1] || '').get('status');
    const [filter, setFilter] = useState(FILTERS.some((f) => f.key === initial) ? initial : 'all');
    const [q, setQ] = useState('');
    const [changeTask, setChangeTask] = useState(null);
    const t = useT();

    useNotifFlash('mytask');

    const visible = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return tasks.filter((t) => {
            if (filter !== 'all' && t.status !== filter) return false;
            if (!needle) return true;
            return t.title.toLowerCase().includes(needle) || (t.description || '').toLowerCase().includes(needle) || (t.category || '').toLowerCase().includes(needle);
        });
    }, [tasks, filter, q]);

    const approve = (task) => router.post(route('tasks.approve', task.id), {}, { preserveScroll: true });
    const remove = (task) => { if (confirm('Delete this task?')) router.delete(route('tasks.destroy', task.id), { preserveScroll: true }); };

    return (
        <PanelLayout title="My Tasks">
            <Head title="My Tasks" />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                    {FILTERS.map((f) => (
                        <button key={f.key} onClick={() => setFilter(f.key)}
                            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${filter === f.key ? 'bg-gold text-ink' : 'bg-ink-700 text-gray-300 hover:text-gold'}`}>
                            {t(f.label)}
                            <span className={`ml-2 rounded-full px-1.5 text-xs ${filter === f.key ? 'bg-ink/20' : 'bg-white/5'}`}>{counts[f.key] ?? 0}</span>
                        </button>
                    ))}
                </div>
                <Link href={route('home') + '#tasks'} className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:border-gold hover:text-gold">{t('+ Post a Task')}</Link>
            </div>

            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Search my tasks…')}
                className="mb-6 w-full max-w-md rounded-full border border-white/10 bg-ink px-5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold" />

            {visible.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">{t('No tasks match this filter.')}</div>
            ) : (
                <div className="space-y-4">
                    {visible.map((task) => (
                        <div key={task.id} id={`mytask-${task.id}`} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-bold text-white">{task.title}</h3>
                                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[task.status]?.cls ?? 'bg-white/10 text-gray-300'}`}>{STATUS[task.status] ? t(STATUS[task.status].label) : task.status}</span>
                                        {task.is_paid && <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">✓ {t('Paid')}</span>}
                                        {!task.is_paid && task.pending_payment && <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">⏳ {t('Payment pending')}</span>}
                                    </div>
                                    <p className="mt-3 max-w-2xl text-sm text-gray-300">{task.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                                        {task.category && <span>📂 {task.category}</span>}
                                        {task.budget && <span>💰 ${task.budget}</span>}
                                        <span>⏰ {fmtDate(task.deadline)}</span>
                                    </div>

                                    {/* Delivery */}
                                    {(task.status === 'delivered' || task.status === 'completed') && (task.deliverable_url || task.deliverable_link || task.deliverable_note) && (
                                        <div className="mt-4 rounded-xl border border-white/10 bg-ink-800 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">📦 {t('Delivery')}</p>
                                            {task.deliverable_note && <p className="mt-2 text-sm text-gray-300">{task.deliverable_note}</p>}
                                            <div className="mt-3 flex flex-wrap gap-3">
                                                {task.deliverable_url && <a href={task.deliverable_url} target="_blank" rel="noreferrer" download className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-300">⬇ {t('Download file')}</a>}
                                                {task.deliverable_link && <a href={task.deliverable_link} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:border-gold hover:text-gold">🔗 {t('Open link')}</a>}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                                    {task.status === 'delivered' && (
                                        <>
                                            <button onClick={() => approve(task)} className="rounded-full bg-green-500/15 px-4 py-1.5 text-sm font-semibold text-green-300 hover:bg-green-500/25">✓ {t('Approve')}</button>
                                            <button onClick={() => setChangeTask(task)} className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-gray-300 hover:bg-white/10">🔁 {t('Request changes')}</button>
                                        </>
                                    )}
                                    {!task.is_paid && !task.pending_payment && task.budget && (
                                        <div className="w-56 space-y-2">
                                            {paypal?.enabled && paypal?.clientId && <PayPalButton task={task} clientId={paypal.clientId} currency={paypal.currency} />}
                                            {d17?.enabled && d17?.number && <D17Button task={task} />}
                                        </div>
                                    )}
                                    <button onClick={() => remove(task)} className="text-sm text-red-400 hover:text-red-300">{t('Delete')}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {changeTask && <RequestChangesModal task={changeTask} onClose={() => setChangeTask(null)} />}
        </PanelLayout>
    );
}
