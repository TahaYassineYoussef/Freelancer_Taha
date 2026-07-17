import PanelLayout from '@/Layouts/PanelLayout';
import PayPalButton from '@/Components/PayPalButton';
import D17Button from '@/Components/D17Button';
import LineChart from '@/Components/LineChart';
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

/** KPI card with an icon, value, label and optional trend badge. */
function Kpi({ icon, value, label, trend }) {
    const up = trend != null && trend >= 0;
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-5">
            <div className="flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-xl">{icon}</span>
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

function DeliverForm({ task, onDone }) {
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
                onSuccess: () => onDone(),
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
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-6">
            <h2 className="mb-4 text-lg font-bold text-white">Latest Clients</h2>
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
                                {c.paid ? 'Paid' : 'Awaiting'}
                            </span>
                            <Link href={route('chat.index', { with: c.id })} className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold text-white hover:border-gold hover:text-gold">
                                Chat
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Dashboard({ role, tasks, stats, kpis, chart, latestClients }) {
    const { paypal, d17 } = usePage().props;
    const isFreelancer = role === 'freelancer';
    const [delivering, setDelivering] = useState(null);
    const [q, setQ] = useState('');

    const act = (name, task, extra = {}) => router.post(route(name, task.id), extra, { preserveScroll: true });
    const remove = (task) => { if (confirm('Delete this task?')) router.delete(route('tasks.destroy', task.id), { preserveScroll: true }); };
    const requestChanges = (task) => router.post(route('tasks.requestChanges', task.id), { note: prompt('What needs changing? (optional)') ?? '' }, { preserveScroll: true });

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
                        <Kpi icon="💰" value={money(kpis.revenue, kpis.currency)} label="This Month Revenue" trend={kpis.revenue_trend} />
                        <Kpi icon="✅" value={kpis.accepted} label="Tasks Accepted" />
                        <Kpi icon="⏱️" value={kpis.on_time_pct != null ? `${kpis.on_time_pct}%` : '—'} label="Delivered On Time" />
                        <Kpi icon="👥" value={kpis.clients} label="Clients" />
                    </>
                ) : (
                    <>
                        <Kpi icon="💳" value={money(kpis.spent, kpis.currency)} label="Total Spent" />
                        <Kpi icon="📋" value={kpis.active} label="Active Tasks" />
                        <Kpi icon="📦" value={kpis.delivered} label="Awaiting Approval" />
                        <Kpi icon="✅" value={kpis.completed} label="Completed" />
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
                <h2 className="text-lg font-bold text-white">{isFreelancer ? 'Incoming Tasks' : 'My Posted Tasks'}</h2>
                <div className="flex items-center gap-3">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search tasks…"
                        className="w-44 rounded-full border border-white/10 bg-ink px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold"
                    />
                    <Link href={route('chat.index')} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-300">Open Chat</Link>
                </div>
            </div>

            {visible.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    {tasks.length === 0 ? 'No tasks yet.' : 'No tasks match your search.'}
                </div>
            ) : (
                <div className="space-y-4">
                    {visible.map((task) => (
                        <div key={task.id} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
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

                                    <DeliveredBox task={task} />
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
                                                <button onClick={() => setDelivering(delivering === task.id ? null : task.id)} className="rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-ink hover:bg-gold-300">📦 Deliver work</button>
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
                                                    <button onClick={() => requestChanges(task)} className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-gray-300 hover:bg-white/10">🔁 Request changes</button>
                                                </>
                                            )}
                                            {!task.is_paid && !task.pending_payment && task.budget && (
                                                <div className="w-56 space-y-2">
                                                    {paypal?.clientId && <PayPalButton task={task} clientId={paypal.clientId} currency={paypal.currency} />}
                                                    {d17?.number && <D17Button task={task} />}
                                                    {!paypal?.clientId && !d17?.number && <span className="block text-right text-xs text-gray-500">No payment method configured yet</span>}
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
        </PanelLayout>
    );
}
