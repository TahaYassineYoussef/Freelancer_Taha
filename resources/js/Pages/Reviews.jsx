import PanelLayout from '@/Layouts/PanelLayout';
import useNotifFlash from '@/useNotifFlash';
import { useT } from '@/i18n';
import { Head, router } from '@inertiajs/react';

export default function Reviews({ reviews }) {
    const t = useT();
    useNotifFlash('review', 'review');

    const setApproved = (t, approved) => router.patch(route('testimonials.review', t.id), { approved }, { preserveScroll: true });
    const remove = (t) => { if (confirm('Delete this review?')) router.delete(route('testimonials.destroy', t.id), { preserveScroll: true }); };

    const pending = reviews.filter((t) => !t.approved).length;

    return (
        <PanelLayout title="Client reviews">
            <Head title="Reviews" />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-2xl text-sm text-gray-400">
                    {t('Reviews clients left about your work. Approve one to publish it on your home page.')}
                </p>
                {pending > 0 && (
                    <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">{pending} {t('awaiting approval')}</span>
                )}
            </div>

            {reviews.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    {t('No reviews yet. When a client leaves one, it shows up here for approval.')}
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map((rev) => (
                        <div key={rev.id} id={`review-${rev.id}`} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-semibold text-white">{rev.user?.name}</span>
                                        <span className="text-gold">{'★'.repeat(rev.rating)}<span className="text-white/20">{'★'.repeat(5 - rev.rating)}</span></span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${rev.approved ? 'bg-green-500/15 text-green-300' : 'bg-gold/15 text-gold'}`}>
                                            {rev.approved ? t('Published') : t('Pending')}
                                        </span>
                                    </div>
                                    {rev.role_title && <p className="text-xs text-gray-500">{rev.role_title}</p>}
                                    <p className="mt-3 text-sm text-gray-300">“{rev.body}”</p>
                                </div>
                                <div className="flex flex-shrink-0 gap-3 text-sm">
                                    {rev.approved ? (
                                        <button onClick={() => setApproved(rev, false)} className="text-gray-400 hover:text-white">{t('Hide')}</button>
                                    ) : (
                                        <button onClick={() => setApproved(rev, true)} className="font-semibold text-green-400 hover:text-green-300">{t('Approve')}</button>
                                    )}
                                    <button onClick={() => remove(rev)} className="text-red-400 hover:text-red-300">{t('Delete')}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PanelLayout>
    );
}
