import PanelLayout from '@/Layouts/PanelLayout';
import useNotifFlash from '@/useNotifFlash';
import { useT } from '@/i18n';
import { Head, router } from '@inertiajs/react';

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

export default function ContactMessages({ messages }) {
    const t = useT();
    useNotifFlash('contact', 'msg');

    const remove = (m) => {
        if (confirm('Delete this message?')) {
            router.delete(route('contact.destroy', m.id), { preserveScroll: true });
        }
    };

    return (
        <PanelLayout title="Inbox">
            <Head title="Inbox" />

            {messages.length === 0 ? (
                <div className="rounded-2xl border border-white/5 bg-ink-700 p-10 text-center text-gray-400">
                    {t('No messages yet. They arrive here from the contact form on your home page.')}
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((m) => (
                        <div key={m.id} id={`contact-${m.id}`} className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="font-bold text-white">{m.subject || t('(No subject)')}</h3>
                                        {!m.read_at && (
                                            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase text-gold">{t('New')}</span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-400">
                                        {t('From')} <span className="text-gold">{m.name}</span> ·{' '}
                                        <a href={`mailto:${m.email}`} className="underline hover:text-white">{m.email}</a>
                                    </p>
                                    <p className="mt-3 max-w-2xl whitespace-pre-wrap text-sm text-gray-300">{m.body}</p>
                                    <p className="mt-3 text-xs text-gray-600">{fmtDate(m.created_at)}</p>
                                </div>
                                <div className="flex flex-shrink-0 gap-3 text-sm">
                                    <a
                                        href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'Your message'))}`}
                                        className="rounded-full bg-gold px-4 py-1.5 font-semibold text-ink hover:bg-gold-300"
                                    >
                                        {t('Reply')}
                                    </a>
                                    <button onClick={() => remove(m)} className="text-red-400 hover:text-red-300">{t('Delete')}</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </PanelLayout>
    );
}
