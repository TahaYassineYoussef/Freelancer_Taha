import PanelLayout from '@/Layouts/PanelLayout';
import PayPalButton from '@/Components/PayPalButton';
import D17Button from '@/Components/D17Button';
import DeliverForm from '@/Components/DeliverForm';
import LineChart from '@/Components/LineChart';
import RequestChangesModal from '@/Components/RequestChangesModal';
import DeliverIcon from '@/Components/DeliverIcon';
import useNotifFlash from '@/useNotifFlash';
import { useT } from '@/i18n';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const STATUS_STYLES = {
    open: 'bg-blue-500/15 text-blue-300',
    in_progress: 'bg-gold/15 text-gold',
    delivered: 'bg-purple-500/15 text-purple-300',
    completed: 'bg-green-500/15 text-green-300',
    declined: 'bg-red-500/15 text-red-300',
};

const STATUS_LABEL = {
    open: 'Open', in_progress: 'In Progress', delivered: 'Delivered', completed: 'Completed', declined: 'Declined',
};

function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function money(n, currency) {
    const v = Number(n ?? 0);
    return currency === 'USD' ? `$${v.toLocaleString()}` : `${v.toLocaleString()} ${currency}`;
}

function Badge({ status }) {
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-white/10 text-gray-300'}`}>
            {STATUS_LABEL[status] ?? status}
        </span>
    );
}

// Filled KPI icons (solid, matching the sidebar/notification icon set).
const KPI_ICONS = {
    money: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.93V19h-2v-1.05c-1.4-.29-2.5-1.13-2.58-2.45h1.5c.09.68.68 1.2 1.66 1.2 1.05 0 1.42-.52 1.42-1.02 0-.68-.36-1.03-1.9-1.4-1.7-.4-2.86-1.1-2.86-2.5 0-1.18.95-1.95 2.16-2.2V6h2v1.06c1.3.32 2.06 1.28 2.11 2.4h-1.5c-.06-.72-.53-1.2-1.5-1.2-.94 0-1.5.42-1.5 1.02 0 .53.4.87 1.9 1.25 1.65.42 2.86 1.05 2.86 2.65 0 1.25-.95 2.05-2.28 2.29z',
    check: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    people: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    card: 'M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z',
    list: 'M3 5h2v2H3V5zm0 6h2v2H3v-2zm0 6h2v2H3v-2zM7 5h14v2H7V5zm0 6h14v2H7v-2zm0 6h14v2H7v-2z',
    box: 'M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 1.1 1.1 2 2 2h14c.9 0 2-.9 2-2V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z',
};

/** KPI card with an icon, value, label and optional trend badge. */
function Kpi({ icon, value, label, trend }) {
    const up = trend != null && trend >= 0;
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-5">
            <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d={KPI_ICONS[icon] ?? KPI_ICONS.list} /></svg>
                </span>
                {trend != null && (
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${up ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                        {up ? '▲' : '▼'} {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className="mt-3 text-2xl font-black text-white">{value}</p>
            <p className="text-sm text-gray-400">{label}</p>
        </div>
    );
}

function DeliveredBox({ task }) {
    if (task.status !== 'delivered' && task.status !== 'completed') return null;
    if (!task.deliverable_url && !task.deliverable_link && !task.deliverable_note) return null;
    return (
        <div className="mt-4 rounded-xl border border-white/10 bg-ink-800 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">📦 Delivery</p>
            {task.deliverable_note && <p className="mt-2 text-sm text-gray-300">{task.deliverable_note}</p>}
            <div className="mt-3 flex flex-wrap gap-3">
                {task.deliverable_url && (
                    <a href={task.deliverable_url} target="_blank" rel="noreferrer" download className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-300">⬇ Download file</a>
                )}
                {task.deliverable_link && (
                    <a href={task.deliverable_link} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:border-gold hover:text-gold">🔗 Open link</a>
                )}
            </div>
            {task.delivered_at && <p className="mt-2 text-[11px] text-gray-500">Delivered {fmtDate(task.delivered_at)}</p>}
        </div>
    );
}

/** Right-column panel listing recent clients (freelancer) with pay status + chat. */
function LatestClients({ clients }) {
    const t = useT();
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">{t('Latest Clients')}</h2>
            {clients.length === 0 ? (
                <p className="text-sm text-gray-500">No clients yet.</p>
            ) : (
                <div className="space-y-3">
                    {clients.map((c) => (
                        <div key={c.id} className="flex items-center gap-3">
                            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-ink">
                                {(c.name ?? '?').charAt(0)}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                                <p className="truncate text-xs text-gray-500">{c.task}</p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.paid ? 'bg-green-500/15 text-green-300' : 'bg-gold/15 text-gold'}`}>
                                {c.paid ? t('Paid') : t('Awaiting')}
                            </span>
                            <Link href={route('chat.index', { with: c.id })} className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white hover:border-gold hover:text-gold">
                                {t('Chat')}
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Dashboard({ role, tasks, stats, kpis, chart, latestClients }) {
    const page = usePage();
    const { paypal, d17 } = page.props;
    const isFreelancer = role === 'freelancer';
    const [delivering, setDelivering] = useState(null);
    const [changeTask, setChangeTask] = useState(null);
    const [q, setQ] = useState('');
    const t = useT();

    useNotifFlash('task');

    const act = (name, task, extra = {}) => router.post(route(name, task.id), extra, { preserveScroll: true });
    const remove = (task) => { if (confirm('Delete this task?')) router.delete(route('tasks.destroy', task.id), { preserveScroll: true }); };

    const visible = tasks.filter((t) =>
        !q || t.title.toLowerCase().includes(q.toLowerCase()) || (t.user?.name ?? '').toLowerCase().includes(q.toLowerCase())
    );

    return (
        <PanelLayout title="Your freelance dashboard overview">
            <Head title="Dashboard" />

            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {isFreelancer ? (
                    <>
                        <Kpi icon="money" value={money(kpis.revenue, kpis.currency)} label={t('This Month Revenue')} trend={kpis.revenue_trend} />
                        <Kpi icon="check" value={kpis.accepted} label={t('Tasks Accepted')} />
                        <Kpi icon="clock" value={kpis.on_time_pct != null ? `${kpis.on_time_pct}%` : '—'} label={t('Delivered On Time')} />
                        <Kpi icon="people" value={kpis.clients} label={t('Clients')} />
                    </>
                ) : (
                    <>
                        <Kpi icon="card" value={money(kpis.spent, kpis.currency)} label={t('Total Spent')} />
                        <Kpi icon="list" value={kpis.active} label={t('Active Tasks')} />
                        <Kpi icon="box" value={kpis.delivered} label={t('Awaiting Approval')} />
                        <Kpi icon="check" value={kpis.completed} label={t('Completed')} />
                    </>
                )}
            </div>

            {/* Chart + latest clients */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <LineChart series={chart} />
                </div>
                {isFreelancer ? (
                    <LatestClients clients={latestClients} />
                ) : (
                    <div className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                        <h2 className="mb-2 text-lg font-bold text-white">Need something done?</h2>
                        <p className="mb-4 text-sm text-gray-400">Post a task and Taha will get back to you.</p>
                        <Link href={route('home') + '#tasks'} className="inline-block rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-300">
                            + Post a Task
                        </Link>
                    </div>
                )}
            </div>

            {/* Task list with full workflow */}
            <div className="mt-8 mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">{isFreelancer ? t('Incoming Tasks') : t('My Posted Tasks')}</h2>
                <div className="flex items-center gap-3">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={t('Search tasks…')}
                        className="w-44 rounded-full border border-white/10 bg-ink px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold"
                    />
                    <Link href={route('chat.index')} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-300">{t('Open Chat')}</Link>
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    {tasks.length === 0 ? 'No tasks yet.' : 'No tasks match your search.'}
                </div>
            ) : (
                <div className="space-y-4">
                    {visible.map((task) => (
                        <div
                            key={task.id}
                            id={`task-${task.id}`}
                            className="rounded-2xl border border-white/5 bg-ink-700 p-6"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-bold text-white">{task.title}</h3>
                                        <Badge status={task.status} />
                                        {task.is_paid && <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">✓ Paid</span>}
                                    </div>
                                    {isFreelancer && task.user && (
                                        <p className="mt-1 text-sm text-gray-400">From <span className="text-gold">{task.user.name}</span> · {task.user.email}</p>
                                    )}
                                    <p className="mt-3 max-w-2xl text-sm text-gray-300">{task.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                                        {task.category && <span>📂 {task.category}</span>}
                                        {task.budget && <span>💰 ${task.budget}</span>}
                                        <span>⏰ Deadline: {fmtDate(task.deadline)}</span>
                                    </div>

                                    {/* Client's change request — highlighted so Taha can't miss what to fix */}
                                    {task.revision_note && task.status === 'in_progress' && (
                                        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">🔁 Changes requested by the client</p>
                                            <p className="mt-2 text-sm text-gray-200">{task.revision_note}</p>
                                        </div>
                                    )}

                                    <DeliveredBox task={task} />

                                    {/* Prominent deliver CTA in the card body */}
                                    {isFreelancer && task.status === 'in_progress' && delivering !== task.id && (
                                        <button
                                            onClick={() => setDelivering(task.id)}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-4 py-3 text-sm font-bold text-ink transition hover:bg-gold-300"
                                        >
                                            <DeliverIcon /> Deliver work to client
                                        </button>
                                    )}
                                    {isFreelancer && task.status === 'open' && (
                                        <p className="mt-3 text-xs text-gray-500">Accept this task to unlock delivery.</p>
                                    )}

                                    {isFreelancer && delivering === task.id && <DeliverForm task={task} onDone={() => setDelivering(null)} />}
                                </div>

                                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                                    {!task.is_paid && task.pending_payment && (
                                        isFreelancer ? (
                                            <Link href={route('payments.index')} className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold hover:bg-gold/25">⏳ Payment pending — review</Link>
                                        ) : (
                                            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">⏳ Payment pending</span>
                                        )
                                    )}

                                    {isFreelancer ? (
                                        <>
                                            {task.status === 'open' && (
                                                <>
                                                    <button onClick={() => act('tasks.accept', task)} className="rounded-full bg-green-500/15 px-4 py-1.5 text-sm font-semibold text-green-300 hover:bg-green-500/25">✓ Accept</button>
                                                    <button onClick={() => act('tasks.decline', task)} className="rounded-full bg-red-500/15 px-4 py-1.5 text-sm font-semibold text-red-300 hover:bg-red-500/25">✕ Decline</button>
                                                </>
                                            )}
                                            {task.status === 'in_progress' && (
                                                <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">In progress</span>
                                            )}
                                            {task.status === 'delivered' && (
                                                <>
                                                    <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300">Awaiting approval</span>
                                                    <button onClick={() => setDelivering(delivering === task.id ? null : task.id)} className="text-xs text-gray-400 hover:text-white">Re-deliver</button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {task.status === 'delivered' && (
                                                <>
                                                    <button onClick={() => act('tasks.approve', task)} className="rounded-full bg-green-500/15 px-4 py-1.5 text-sm font-semibold text-green-300 hover:bg-green-500/25">✓ Approve</button>
                                                    <button onClick={() => setChangeTask(task)} className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-gray-300 hover:bg-white/10">🔁 Request changes</button>
                                                </>
                                            )}
                                            {!task.is_paid && !task.pending_payment && task.budget && (
                                                <div className="w-56 space-y-2">
                                                    {paypal?.enabled && paypal?.clientId && <PayPalButton task={task} clientId={paypal.clientId} currency={paypal.currency} />}
                                                    {d17?.number && <D17Button task={task} />}
                                                    {!(paypal?.enabled && paypal?.clientId) && !d17?.number && <span className="block text-right text-xs text-gray-500">{t('No payment method configured yet')}</span>}
                                                </div>
                                            )}
                                            <button onClick={() => remove(task)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
                                        </>
                                    )}
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
