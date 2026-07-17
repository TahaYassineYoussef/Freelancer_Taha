import PanelLayout from '@/Layouts/PanelLayout';
import PayPalButton from '@/Components/PayPalButton';
import D17Button from '@/Components/D17Button';
import { Head, Link, router, usePage } from '@inertiajs/react';

const STATUS_STYLES = {
    open: 'bg-blue-500/15 text-blue-300',
    in_progress: 'bg-gold/15 text-gold',
    completed: 'bg-green-500/15 text-green-300',
    declined: 'bg-red-500/15 text-red-300',
};

const STATUS_LABEL = {
    open: 'Open',
    in_progress: 'In Progress',
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
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}>
            {STATUS_LABEL[status]}
        </span>
    );
}

export default function Dashboard({ role, tasks, stats }) {
    const { auth, paypal, d17 } = usePage().props;
    const isFreelancer = role === 'freelancer';

    const setStatus = (task, status) => {
        router.patch(route('tasks.status', task.id), { status }, { preserveScroll: true });
    };

    const remove = (task) => {
        if (confirm('Delete this task?')) {
            router.delete(route('tasks.destroy', task.id), { preserveScroll: true });
        }
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
                    <Link
                        href={route('chat.index')}
                        className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gold-300"
                    >
                        Open Chat
                    </Link>
                    {!isFreelancer && (
                        <Link
                            href={route('home') + '#tasks'}
                            className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white transition hover:border-gold hover:text-gold"
                        >
                            + Post a Task
                        </Link>
                    )}
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    No tasks yet.
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-white">{task.title}</h3>
                                        <Badge status={task.status} />
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
                                </div>

                                <div className="flex flex-col items-end gap-3">
                                    {task.is_paid && (
                                        <span className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300">
                                            ✓ Paid
                                        </span>
                                    )}
                                    {!task.is_paid && task.pending_payment && (
                                        isFreelancer ? (
                                            <Link
                                                href={route('payments.index')}
                                                className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold transition hover:bg-gold/25"
                                                title="Review this payment on the Payments page"
                                            >
                                                ⏳ Payment pending — review
                                            </Link>
                                        ) : (
                                            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                                                ⏳ Payment pending
                                            </span>
                                        )
                                    )}

                                    {isFreelancer ? (
                                        <select
                                            value={task.status}
                                            onChange={(e) => setStatus(task, e.target.value)}
                                            className="rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-white focus:border-gold focus:ring-gold"
                                        >
                                            <option value="open">Open</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="declined">Declined</option>
                                        </select>
                                    ) : (
                                        <>
                                            {!task.is_paid && !task.pending_payment && task.budget && (
                                                <div className="w-56 space-y-2">
                                                    {paypal?.clientId && (
                                                        <PayPalButton task={task} clientId={paypal.clientId} currency={paypal.currency} />
                                                    )}
                                                    {d17?.number && <D17Button task={task} />}
                                                    {!paypal?.clientId && !d17?.number && (
                                                        <span className="block text-right text-xs text-gray-500">
                                                            No payment method configured yet
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <button
                                                onClick={() => remove(task)}
                                                className="text-sm text-red-400 hover:text-red-300"
                                            >
                                                Delete
                                            </button>
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
