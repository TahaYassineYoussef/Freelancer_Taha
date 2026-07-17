import PanelLayout from '@/Layouts/PanelLayout';
import PayPalButton from '@/Components/PayPalButton';
import D17Button from '@/Components/D17Button';
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
    open: 'Open',
    in_progress: 'In Progress',
    delivered: 'Delivered',
    completed: 'Completed',
    declined: 'Declined',
};

function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Stat({ label, value, accent }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-5">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`mt-1 text-3xl font-black ${accent ?? 'text-white'}`}>{value}</p>
        </div>
    );
}

function Badge({ status }) {
    return (
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status] ?? 'bg-white/10 text-gray-300'}`}>
            {STATUS_LABEL[status] ?? status}
        </span>
    );
}

/** Freelancer's delivery form (file up to 300MB and/or a link + note). */
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
                onFinish: () => {
                    setBusy(false);
                    setProgress(null);
                },
            }
        );
    };

    return (
        <div className="mt-4 w-full space-y-3 rounded-xl border border-purple-500/20 bg-ink-800 p-4">
            <p className="text-sm font-semibold text-white">Deliver your work</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Message to the client (optional)"
                className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold"
            />
            <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Link (GitHub, Drive, WeTransfer…) — for large deliverables"
                className="w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold"
            />
            <label className="block text-xs text-gray-400">
                or upload a file (up to 300&nbsp;MB)
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0] ?? null)}
                    className="mt-1 block w-full text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-ink hover:file:bg-gold-300"
                />
            </label>
            {busy && progress != null && (
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gold transition-[width]" style={{ width: `${progress}%` }} />
                </div>
            )}
            <button
                onClick={submit}
                disabled={busy}
                className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink hover:bg-gold-300 disabled:opacity-60"
            >
                {busy ? `Sending… ${progress ?? 0}%` : 'Send delivery'}
            </button>
        </div>
    );
}

/** Shows what was delivered, for both sides. */
function DeliveredBox({ task }) {
    if (task.status !== 'delivered' && task.status !== 'completed') return null;
    if (!task.deliverable_url && !task.deliverable_link && !task.deliverable_note) return null;

    return (
        <div className="mt-4 rounded-xl border border-white/10 bg-ink-800 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">📦 Delivery</p>
            {task.deliverable_note && <p className="mt-2 text-sm text-gray-300">{task.deliverable_note}</p>}
            <div className="mt-3 flex flex-wrap gap-3">
                {task.deliverable_url && (
                    <a href={task.deliverable_url} target="_blank" rel="noreferrer" download
                        className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-300">
                        ⬇ Download file
                    </a>
                )}
                {task.deliverable_link && (
                    <a href={task.deliverable_link} target="_blank" rel="noreferrer"
                        className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:border-gold hover:text-gold">
                        🔗 Open link
                    </a>
                )}
            </div>
            {task.delivered_at && (
                <p className="mt-2 text-[11px] text-gray-500">Delivered {fmtDate(task.delivered_at)}</p>
            )}
        </div>
    );
}

export default function Dashboard({ role, tasks, stats }) {
    const { auth, paypal, d17 } = usePage().props;
    const isFreelancer = role === 'freelancer';
    const [delivering, setDelivering] = useState(null); // task id whose deliver form is open

    const act = (name, task, extra = {}) =>
        router.post(route(name, task.id), extra, { preserveScroll: true });

    const remove = (task) => {
        if (confirm('Delete this task?')) {
            router.delete(route('tasks.destroy', task.id), { preserveScroll: true });
        }
    };

    const requestChanges = (task) => {
        const note = prompt('What needs changing? (optional)') ?? '';
        router.post(route('tasks.requestChanges', task.id), { note }, { preserveScroll: true });
    };

    return (
        <PanelLayout title={isFreelancer ? 'Freelancer Dashboard' : `Welcome, ${auth.user.name}`}>
            <Head title="Dashboard" />

            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label="Open" value={stats.open} accent="text-blue-300" />
                <Stat label="In Progress" value={stats.in_progress} accent="text-gold" />
                <Stat label="Completed" value={stats.completed} accent="text-green-300" />
                <Stat label="Unread Messages" value={stats.unread_messages} accent="text-white" />
            </div>

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">
                    {isFreelancer ? 'Incoming Tasks' : 'My Posted Tasks'}
                </h2>
                <div className="flex gap-3">
                    <Link href={route('chat.index')} className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gold-300">
                        Open Chat
                    </Link>
                    {!isFreelancer && (
                        <Link href={route('home') + '#tasks'} className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:border-gold hover:text-gold">
                            + Post a Task
                        </Link>
                    )}
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">No tasks yet.</div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h3 className="text-lg font-bold text-white">{task.title}</h3>
                                        <Badge status={task.status} />
                                        {task.is_paid && (
                                            <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">✓ Paid</span>
                                        )}
                                    </div>
                                    {isFreelancer && task.user && (
                                        <p className="mt-1 text-sm text-gray-400">
                                            From <span className="text-gold">{task.user.name}</span> · {task.user.email}
                                        </p>
                                    )}
                                    <p className="mt-3 max-w-2xl text-sm text-gray-300">{task.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-400">
                                        {task.category && <span>📂 {task.category}</span>}
                                        {task.budget && <span>💰 ${task.budget}</span>}
                                        <span>⏰ Deadline: {fmtDate(task.deadline)}</span>
                                    </div>

                                    <DeliveredBox task={task} />

                                    {/* Freelancer's deliver form */}
                                    {isFreelancer && delivering === task.id && (
                                        <DeliverForm task={task} onDone={() => setDelivering(null)} />
                                    )}
                                </div>

                                {/* Action column */}
                                <div className="flex flex-shrink-0 flex-col items-end gap-2">
                                    {!task.is_paid && task.pending_payment && (
                                        isFreelancer ? (
                                            <Link href={route('payments.index')} className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold hover:bg-gold/25">
                                                ⏳ Payment pending — review
                                            </Link>
                                        ) : (
                                            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">⏳ Payment pending</span>
                                        )
                                    )}

                                    {isFreelancer ? (
                                        <>
                                            {task.status === 'open' && (
                                                <>
                                                    <button onClick={() => act('tasks.accept', task)} className="rounded-full bg-green-500/15 px-4 py-1.5 text-sm font-semibold text-green-300 hover:bg-green-500/25">
                                                        ✓ Accept
                                                    </button>
                                                    <button onClick={() => act('tasks.decline', task)} className="rounded-full bg-red-500/15 px-4 py-1.5 text-sm font-semibold text-red-300 hover:bg-red-500/25">
                                                        ✕ Decline
                                                    </button>
                                                </>
                                            )}
                                            {task.status === 'in_progress' && (
                                                <button onClick={() => setDelivering(delivering === task.id ? null : task.id)} className="rounded-full bg-gold px-4 py-1.5 text-sm font-bold text-ink hover:bg-gold-300">
                                                    📦 Deliver work
                                                </button>
                                            )}
                                            {task.status === 'delivered' && (
                                                <>
                                                    <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-300">Awaiting approval</span>
                                                    <button onClick={() => setDelivering(delivering === task.id ? null : task.id)} className="text-xs text-gray-400 hover:text-white">
                                                        Re-deliver
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {task.status === 'delivered' && (
                                                <>
                                                    <button onClick={() => act('tasks.approve', task)} className="rounded-full bg-green-500/15 px-4 py-1.5 text-sm font-semibold text-green-300 hover:bg-green-500/25">
                                                        ✓ Approve
                                                    </button>
                                                    <button onClick={() => requestChanges(task)} className="rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-gray-300 hover:bg-white/10">
                                                        🔁 Request changes
                                                    </button>
                                                </>
                                            )}
                                            {!task.is_paid && !task.pending_payment && task.budget && (
                                                <div className="w-56 space-y-2">
                                                    {paypal?.clientId && <PayPalButton task={task} clientId={paypal.clientId} currency={paypal.currency} />}
                                                    {d17?.number && <D17Button task={task} />}
                                                    {!paypal?.clientId && !d17?.number && (
                                                        <span className="block text-right text-xs text-gray-500">No payment method configured yet</span>
                                                    )}
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
