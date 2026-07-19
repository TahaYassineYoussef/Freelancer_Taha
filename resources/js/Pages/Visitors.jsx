import LineChart from '@/Components/LineChart';
import PanelLayout from '@/Layouts/PanelLayout';
import { useT } from '@/i18n';
import { Head } from '@inertiajs/react';

function Kpi({ label, value, accent, hint }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-5">
            <p className="text-sm text-gray-400">{label}</p>
            <p className={`mt-1 text-3xl font-black ${accent ?? 'text-white'}`}>{value}</p>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );
}

/** A ranked list with a proportional bar behind each row. */
function TopList({ title, rows, empty, format }) {
    const max = Math.max(1, ...rows.map((r) => r.count));
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-400">{title}</h3>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">{empty}</p>
            ) : (
                <div className="space-y-2">
                    {rows.map((r) => (
                        <div key={r.label} className="relative overflow-hidden rounded-lg bg-white/5 px-3 py-2">
                            <div className="absolute inset-y-0 left-0 bg-gold/15" style={{ width: `${(r.count / max) * 100}%` }} />
                            <div className="relative flex items-center justify-between gap-3 text-sm">
                                <span className="truncate text-gray-200">{format ? format(r.label) : r.label}</span>
                                <span className="font-bold text-white">{r.count}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function Visitors({ kpis, chart, topPages, topReferrers, devices, browsers, latest }) {
    const t = useT();

    return (
        <PanelLayout title="Visitors">
            <Head title="Visitors" />

            <div className="mb-6">
                <h2 className="text-2xl font-black text-white">{t('Website traffic')}</h2>
                <p className="mt-1 text-sm text-gray-400">
                    {t('Who is visiting your site, how many are new, and where they come from. Your own visits are not counted.')}
                </p>
            </div>

            {/* Live + today */}
            <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <Kpi
                    label={t('Online now')}
                    value={<span className="inline-flex items-center gap-2">{kpis.online}<span className="h-2.5 w-2.5 animate-pulse rounded-full bg-green-400" /></span>}
                    accent="text-green-300"
                    hint={t('last 5 minutes')}
                />
                <Kpi label={t('Visitors today')} value={kpis.today_visitors} accent="text-gold" hint={`${kpis.today_views} ${t('page views')}`} />
                <Kpi label={t('New today')} value={kpis.today_new} accent="text-blue-300" hint={t('first time here')} />
                <Kpi label={t('Returning today')} value={kpis.today_returning} accent="text-purple-300" hint={t('been here before')} />
            </div>

            {/* Totals */}
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
                <Kpi label={t('Visitors (30 days)')} value={kpis.month_visitors} />
                <Kpi label={t('Page views (30 days)')} value={kpis.month_views} />
                <Kpi label={t('Page views (all time)')} value={kpis.total_views} />
            </div>

            <div className="mb-6">
                <LineChart title={t('Traffic')} series={chart} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <TopList title={t('Top pages')} rows={topPages} empty={t('No visits yet.')} />
                <TopList
                    title={t('Where visitors come from')}
                    rows={topReferrers}
                    empty={t('No referrers yet — visitors typed your address directly.')}
                />
                <TopList title={t('Devices')} rows={devices} empty={t('No visits yet.')} format={(d) => t(d)} />
                <TopList title={t('Browsers')} rows={browsers} empty={t('No visits yet.')} />
            </div>

            {/* Recent activity */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/5 bg-ink-700">
                <h3 className="border-b border-white/5 px-5 py-3 text-sm font-bold uppercase tracking-wide text-gray-400">
                    {t('Latest visits')}
                </h3>
                {latest.length === 0 ? (
                    <p className="px-5 py-8 text-center text-sm text-gray-500">{t('No visits yet.')}</p>
                ) : (
                    <div className="divide-y divide-white/5">
                        {latest.map((v) => (
                            <div key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.is_new ? 'bg-blue-500/15 text-blue-300' : 'bg-white/10 text-gray-400'}`}>
                                    {v.is_new ? t('New') : t('Returning')}
                                </span>
                                <span className="font-medium text-white">{v.path}</span>
                                {v.referrer && <span className="text-xs text-gray-500">← {v.referrer}</span>}
                                <span className="ml-auto text-xs text-gray-500">{t(v.device)} · {v.browser} · {v.when}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </PanelLayout>
    );
}
