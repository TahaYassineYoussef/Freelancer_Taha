import PanelLayout from '@/Layouts/PanelLayout';
import { useT } from '@/i18n';
import { Head, router } from '@inertiajs/react';

const STATUS_STYLES = {
    completed: 'bg-green-500/15 text-green-300',
    pending: 'bg-gold/15 text-gold',
    failed: 'bg-red-500/15 text-red-300',
};

const STATUS_LABEL = { completed: 'Completed', pending: 'Pending', failed: 'Failed' };

const PROVIDER_LABEL = {
    paypal: 'PayPal',
    d17: 'D17',
};

function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function money(amount, currency) {
    const n = Number(amount ?? 0);
    if (currency === 'USD') return `$${n.toFixed(2)}`;
    return `${n.toFixed(2)} ${currency}`;
}

function Stat({ label, value, accent }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-5">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`mt-1 text-3xl font-black ${accent ?? 'text-white'}`}>{value}</p>
        </div>
    );
}

export default function Payments({ payments, stats }) {
    const t = useT();
    const review = (payment, status) => {
        router.patch(route('payments.review', payment.id), { status }, { preserveScroll: true });
    };

    return (
        <PanelLayout title="Payments">
            <Head title="Payments" />

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat label={t('Total Received')} value={money(stats.total_received, stats.currency)} accent="text-green-300" />
                <Stat label={t('Completed Payments')} value={stats.completed_count} accent="text-white" />
                <Stat label={t('Pending Review')} value={stats.pending_count} accent="text-gold" />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/5 bg-ink-700">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-400">
                            <tr>
                                <th className="px-5 py-3">{t('Date')}</th>
                                <th className="px-5 py-3">{t('Client')}</th>
                                <th className="px-5 py-3">{t('Task')}</th>
                                <th className="px-5 py-3">{t('Amount')}</th>
                                <th className="px-5 py-3">{t('Method')}</th>
                                <th className="px-5 py-3">{t('Reference')}</th>
                                <th className="px-5 py-3">{t('Status')}</th>
                                <th className="px-5 py-3 text-right">{t('Action')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {payments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-gray-500">
                                        {t('No payments yet. They appear here once a client pays for a task.')}
                                    </td>
                                </tr>
                            ) : (
                                payments.map((p) => (
                                    <tr key={p.id} className="text-gray-200">
                                        <td className="whitespace-nowrap px-5 py-3 text-gray-400">{fmtDate(p.created_at)}</td>
                                        <td className="px-5 py-3">
                                            <div className="font-medium text-white">{p.user?.name ?? '—'}</div>
                                            <div className="text-xs text-gray-500">{p.user?.email}</div>
                                        </td>
                                        <td className="px-5 py-3">{p.task?.title ?? '—'}</td>
                                        <td className="whitespace-nowrap px-5 py-3 font-semibold text-white">
                                            {money(p.amount, p.currency)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${p.provider === 'd17' ? 'bg-[#31a9e0]/15 text-[#7fd0f2]' : 'bg-blue-500/15 text-blue-300'}`}>
                                                {PROVIDER_LABEL[p.provider] ?? p.provider}
                                            </span>
                                        </td>
                                        <td className="max-w-[160px] truncate px-5 py-3 font-mono text-xs text-gray-500" title={p.provider_order_id}>
                                            {p.provider_order_id ?? '—'}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[p.status] ?? 'bg-white/10 text-gray-300'}`}>
                                                {STATUS_LABEL[p.status] ? t(STATUS_LABEL[p.status]) : p.status}
                                            </span>
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3 text-right">
                                            {p.status === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => review(p, 'completed')}
                                                        className="rounded-full bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-300 hover:bg-green-500/25"
                                                    >
                                                        ✓ {t('Confirm')}
                                                    </button>
                                                    <button
                                                        onClick={() => review(p, 'failed')}
                                                        className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-300 hover:bg-red-500/25"
                                                    >
                                                        ✕ {t('Reject')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-600">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PanelLayout>
    );
}
