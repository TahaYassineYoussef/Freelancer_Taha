import PanelLayout from '@/Layouts/PanelLayout';
import { useT } from '@/i18n';
import { Head, router } from '@inertiajs/react';

const CATEGORY_STYLES = {
    scam: 'bg-red-500/15 text-red-300',
    spam: 'bg-red-500/15 text-red-300',
    profanity: 'bg-orange-500/15 text-orange-300',
    insult: 'bg-orange-500/15 text-orange-300',
    off_topic: 'bg-blue-500/15 text-blue-300',
    flagged: 'bg-gold/15 text-gold',
};

function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
}

function Stat({ label, value, accent }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-5">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`mt-1 text-3xl font-black ${accent ?? 'text-white'}`}>{value}</p>
        </div>
    );
}

export default function ModerationLog({ logs, stats }) {
    const t = useT();
    const remove = (log) => {
        if (confirm('Delete this record?')) {
            router.delete(route('moderation.destroy', log.id), { preserveScroll: true });
        }
    };

    return (
        <PanelLayout title="Blocked Submissions">
            <Head title="Blocked" />

            <p className="mb-6 max-w-2xl text-sm text-gray-400">
                {t('Every task, review or message the moderation filter rejected before it reached your site — what they wrote, why it was blocked, and who sent it.')}
            </p>

            <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat label={t('Total blocked')} value={stats.total} accent="text-white" />
                <Stat label={t('Scam / spam')} value={stats.scam} accent="text-red-300" />
                <Stat label={t('Offensive')} value={stats.profanity} accent="text-orange-300" />
                <Stat label={t('Caught by AI')} value={stats.by_ai} accent="text-gold" />
            </div>

            {logs.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    🛡️ {t('Nothing blocked yet. When someone tries to post profanity or a scam, it shows up here.')}
                </div>
            ) : (
                <div className="space-y-4">
                    {logs.map((log) => (
                        <div key={log.id} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${CATEGORY_STYLES[log.category] ?? 'bg-white/10 text-gray-300'}`}>
                                            {log.category}
                                        </span>
                                        <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-400">
                                            {log.detected_by === 'ai' ? <>🤖 {t('AI')}</> : <>📋 {t('word list')}</>}
                                        </span>
                                        {log.context && <span className="text-xs text-gray-500">· {log.context}</span>}
                                    </div>

                                    {/* What they actually wrote */}
                                    <blockquote className="mt-3 border-l-2 border-red-500/40 bg-ink-800 px-4 py-3 text-sm italic text-gray-200">
                                        “{log.content}”
                                    </blockquote>

                                    <p className="mt-2 text-xs text-gray-500">
                                        {t('Reason:')} <span className="text-gray-400">{log.reason}</span>
                                    </p>

                                    <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                                        <span>
                                            👤 {log.user ? <span className="text-gold">{log.user.name}</span> : t('Guest')}
                                            {log.user?.email && ` · ${log.user.email}`}
                                        </span>
                                        {log.ip && <span>🌐 {log.ip}</span>}
                                        <span>🕒 {fmtDate(log.created_at)}</span>
                                    </div>
                                </div>

                                <button onClick={() => remove(log)} className="flex-shrink-0 text-sm text-red-400 hover:text-red-300">
                                    {t('Delete')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PanelLayout>
    );
}
