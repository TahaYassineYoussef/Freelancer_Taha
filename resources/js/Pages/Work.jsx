import PanelLayout from '@/Layouts/PanelLayout';
import DeliverForm from '@/Components/DeliverForm';
import DeliverIcon from '@/Components/DeliverIcon';
import useNotifFlash from '@/useNotifFlash';
import { useT } from '@/i18n';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';

function fmtDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Section({ title, color, children, count }) {
    if (count === 0) return null;
    return (
        <div>
            <h2 className={`mb-3 text-sm font-bold uppercase tracking-wide ${color}`}>{title} ({count})</h2>
            <div className="space-y-4">{children}</div>
        </div>
    );
}

function DeliveredInfo({ task }) {
    const t = useT();
    if (!task.deliverable_url && !task.deliverable_link && !task.deliverable_note) return null;
    return (
        <div className="mt-4 rounded-xl border border-white/10 bg-ink-800 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">📦 {t('What you delivered')}</p>
            {task.deliverable_note && <p className="mt-2 text-sm text-gray-300">{task.deliverable_note}</p>}
            <div className="mt-3 flex flex-wrap gap-3">
                {task.deliverable_url && <a href={task.deliverable_url} target="_blank" rel="noreferrer" className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-300">⬇ {t('File')}</a>}
                {task.deliverable_link && <a href={task.deliverable_link} target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white hover:border-gold hover:text-gold">🔗 {t('Link')}</a>}
            </div>
            {task.delivered_at && <p className="mt-2 text-[11px] text-gray-500">{t('Delivered')} {fmtDate(task.delivered_at)}</p>}
        </div>
    );
}

function Card({ task, badge, badgeClass, children, footer }) {
    const t = useT();
    return (
        <div id={`work-${task.id}`} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-bold text-white">{task.title}</h3>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>{badge}</span>
                    </div>
                    {task.client && <p className="mt-1 text-sm text-gray-400">{t('For')} <span className="text-gold">{task.client.name}</span></p>}
                    <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-400">
                        {task.budget && <span>💰 ${task.budget}</span>}
                        <span>⏰ {t('Deadline:')} {fmtDate(task.deadline)}</span>
                    </div>
                    {children}
                </div>
                {footer}
            </div>
        </div>
    );
}

export default function Work({ tasks }) {
    const [delivering, setDelivering] = useState(null);
    const t = useT();
    useNotifFlash('work');

    const toDeliver = tasks.filter((t) => t.status === 'in_progress');
    const awaiting = tasks.filter((t) => t.status === 'delivered');
    const done = tasks.filter((t) => t.status === 'completed');

    return (
        <PanelLayout title="My deliveries">
            <Head title="Deliveries" />

            <p className="mb-6 max-w-2xl text-sm text-gray-400">
                {t("Your delivery workspace. Send work to clients here, track what's awaiting their approval, and see what's completed.")}
            </p>

            {tasks.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    {t('Nothing to deliver yet. Accept a task on your dashboard and it appears here.')}
                </div>
            ) : (
                <div className="space-y-8">
                    <Section title={t('Ready to deliver')} color="text-gold" count={toDeliver.length}>
                        {toDeliver.map((task) => (
                            <Card key={task.id} task={task} badge={t('In progress')} badgeClass="bg-gold/15 text-gold"
                                footer={
                                    delivering === task.id
                                        ? <button onClick={() => setDelivering(null)} className="text-sm text-gray-400 hover:text-white">{t('Cancel')}</button>
                                        : <button onClick={() => setDelivering(task.id)} className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink hover:bg-gold-300"><DeliverIcon /> {t('Deliver')}</button>
                                }>
                                {task.revision_note && (
                                    <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">🔁 {t('Client requested changes')}</p>
                                        <p className="mt-2 text-sm text-gray-200">{task.revision_note}</p>
                                    </div>
                                )}
                                {delivering === task.id && <DeliverForm task={task} onDone={() => setDelivering(null)} />}
                            </Card>
                        ))}
                    </Section>

                    <Section title={t('Awaiting client approval')} color="text-purple-300" count={awaiting.length}>
                        {awaiting.map((task) => (
                            <Card key={task.id} task={task} badge={t('Delivered')} badgeClass="bg-purple-500/15 text-purple-300">
                                <DeliveredInfo task={task} />
                            </Card>
                        ))}
                    </Section>

                    <Section title={t('Completed')} color="text-green-300" count={done.length}>
                        {done.map((task) => (
                            <Card key={task.id} task={task} badge={<>✓ {t('Completed')}</>} badgeClass="bg-green-500/15 text-green-300">
                                <DeliveredInfo task={task} />
                            </Card>
                        ))}
                    </Section>
                </div>
            )}

            <div className="mt-6">
                <Link href={route('dashboard')} className="text-sm text-gold hover:text-gold-300">← {t('Back to dashboard')}</Link>
            </div>
        </PanelLayout>
    );
}
