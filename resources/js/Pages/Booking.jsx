import CalendarMonth from '@/Components/CalendarMonth';
import PanelLayout from '@/Layouts/PanelLayout';
import useNotifFlash from '@/useNotifFlash';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const STATUS = {
    pending: { label: 'Pending', block: 'bg-gold/20 border-gold/40 text-gold', badge: 'bg-gold/15 text-gold' },
    confirmed: { label: 'Confirmed', block: 'bg-green-500/20 border-green-500/40 text-green-200', badge: 'bg-green-500/15 text-green-300' },
    declined: { label: 'Declined', block: 'bg-red-500/20 border-red-500/40 text-red-200', badge: 'bg-red-500/15 text-red-300' },
    cancelled: { label: 'Cancelled', block: 'bg-white/10 border-white/20 text-gray-300', badge: 'bg-white/10 text-gray-400' },
};

function BookModal({ slot, onClose }) {
    const { data, setData, post, processing, errors, reset } = useForm({ starts_at: slot.at, topic: '', note: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('booking.store'), { preserveScroll: true, onSuccess: () => { reset(); onClose(); } });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-black text-white">Request a call</h3>
                <p className="mt-1 text-sm text-gold">📅 {slot.dayLabel} · {slot.label} (1 hour)</p>
                <form onSubmit={submit} className="mt-5 space-y-4">
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">What's it about?</label>
                        <input type="text" value={data.topic} onChange={(e) => setData('topic', e.target.value)} placeholder="e.g. Discuss a new website project"
                            className="w-full rounded-xl border-white/10 bg-ink px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold" autoFocus />
                        {errors.topic && <p className="mt-1 text-xs text-red-400">{errors.topic}</p>}
                    </div>
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-400">Anything else? (optional)</label>
                        <textarea value={data.note} onChange={(e) => setData('note', e.target.value)} rows={3} placeholder="Details, questions, links…"
                            className="w-full rounded-xl border-white/10 bg-ink px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold" />
                        {errors.note && <p className="mt-1 text-xs text-red-400">{errors.note}</p>}
                    </div>
                    {errors.starts_at && <p className="text-xs text-red-400">{errors.starts_at}</p>}
                    <div className="flex justify-end gap-3 pt-1">
                        <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white">Cancel</button>
                        <button type="submit" disabled={processing} className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink hover:bg-gold-300 disabled:opacity-60">
                            {processing ? 'Sending…' : 'Send request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DayModal({ day, onPick, onClose }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-800 p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-black text-white">{day.label}</h3>
                <p className="mt-1 text-sm text-gray-400">Pick a one-hour slot to request a call.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                    {day.slots.map((s) => (
                        <button key={s.at} onClick={() => onPick({ ...s, dayLabel: day.label })}
                            className="rounded-full border border-white/10 bg-ink-700 px-4 py-1.5 text-sm font-semibold text-gray-200 transition hover:border-gold hover:text-gold">
                            {s.label}
                        </button>
                    ))}
                </div>
                <div className="mt-5 text-right">
                    <button onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white">Close</button>
                </div>
            </div>
        </div>
    );
}

export default function Booking({ days, bookings }) {
    const { flash } = usePage().props;
    const [dayModal, setDayModal] = useState(null);
    const [slot, setSlot] = useState(null);

    useNotifFlash('booking');

    const openByDate = useMemo(() => Object.fromEntries(days.map((d) => [d.date, d])), [days]);
    const bookingsByDate = useMemo(() => {
        const map = {};
        bookings.forEach((b) => { (map[b.date] ??= []).push(b); });
        return map;
    }, [bookings]);

    const cancel = (b) => { if (confirm('Cancel this booking?')) router.delete(route('booking.destroy', b.id), { preserveScroll: true }); };

    const renderDay = (dateStr, { isPast }) => {
        const mine = bookingsByDate[dateStr] || [];
        const open = !isPast && openByDate[dateStr];
        return (
            <>
                {mine.map((b) => (
                    <div key={b.id} title={`${b.time} · ${b.topic}`} className={`truncate rounded border px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${STATUS[b.status]?.block}`}>
                        {b.time} {b.topic}
                    </div>
                ))}
                {open && (
                    <button onClick={() => setDayModal(open)} className="block w-full rounded border border-dashed border-gold/40 bg-gold/5 px-1.5 py-0.5 text-[10px] font-bold text-gold transition hover:bg-gold/15">
                        ＋ {open.slots.length} free
                    </button>
                )}
            </>
        );
    };

    return (
        <PanelLayout title="Book a Call">
            <Head title="Book a Call" />

            {flash?.success && (
                <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">{flash.success}</div>
            )}

            <div className="mb-5">
                <h2 className="text-2xl font-black text-white">Book a call with Taha</h2>
                <p className="mt-1 text-sm text-gray-400">Days with a gold <span className="font-semibold text-gold">＋ free</span> tag are open. Click one to pick a one-hour slot.</p>
            </div>

            <CalendarMonth renderDay={renderDay} />

            {/* Your calls */}
            <div className="mt-8">
                <h2 className="mb-4 text-lg font-black text-white">Your calls</h2>
                {bookings.length === 0 ? (
                    <p className="rounded-2xl border border-white/5 bg-ink-700 p-6 text-sm text-gray-400">You haven't booked any calls yet.</p>
                ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {bookings.map((b) => (
                            <div key={b.id} id={`booking-${b.id}`} className="rounded-2xl border border-white/5 bg-ink-700 p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[b.status]?.badge}`}>{STATUS[b.status]?.label}</span>
                                    {!b.is_past && (b.status === 'pending' || b.status === 'confirmed') && (
                                        <button onClick={() => cancel(b)} className="text-xs text-red-400 hover:text-red-300">Cancel</button>
                                    )}
                                </div>
                                <p className="mt-2 text-sm font-semibold text-white">{b.topic}</p>
                                <p className="mt-1 text-xs text-gray-400">🕑 {b.when}–{b.ends}</p>
                                {b.note && <p className="mt-2 text-xs text-gray-500">{b.note}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {dayModal && <DayModal day={dayModal} onPick={(s) => { setSlot(s); setDayModal(null); }} onClose={() => setDayModal(null)} />}
            {slot && <BookModal slot={slot} onClose={() => setSlot(null)} />}
        </PanelLayout>
    );
}
