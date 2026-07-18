import CalendarMonth from '@/Components/CalendarMonth';
import PanelLayout from '@/Layouts/PanelLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const STATUS = {
    pending: { label: 'Pending', dot: 'bg-gold', block: 'bg-gold/20 border-gold/40 text-gold', badge: 'bg-gold/15 text-gold' },
    confirmed: { label: 'Confirmed', dot: 'bg-green-400', block: 'bg-green-500/20 border-green-500/40 text-green-200', badge: 'bg-green-500/15 text-green-300' },
    declined: { label: 'Declined', dot: 'bg-red-400', block: 'bg-red-500/20 border-red-500/40 text-red-200', badge: 'bg-red-500/15 text-red-300' },
    cancelled: { label: 'Cancelled', dot: 'bg-gray-400', block: 'bg-white/10 border-white/20 text-gray-300', badge: 'bg-white/10 text-gray-400' },
};

/** Modal to set / clear availability for one specific date. */
function AvailabilityDayModal({ day, onClose }) {
    const hasOverride = day.source === 'override';
    const { data, setData, post, processing, errors } = useForm({
        date: day.date,
        is_open: day.is_open,
        start_time: day.start_time,
        end_time: day.end_time,
    });

    const save = (e) => {
        e.preventDefault();
        post(route('availability.date.store'), { preserveScroll: true, onSuccess: onClose });
    };
    const revert = () => router.delete(route('availability.date.destroy', day.date), { preserveScroll: true, onSuccess: onClose });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-ink-800 p-6" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-black text-white">{day.label}</h3>
                <p className="mt-1 text-xs text-gray-400">
                    {hasOverride ? 'Custom hours set for this date.' : 'Following your weekly hours. Set a custom rule below.'}
                </p>

                <form onSubmit={save} className="mt-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setData('is_open', !data.is_open)}
                            className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${data.is_open ? 'bg-gold' : 'bg-white/15'}`}>
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${data.is_open ? 'left-[22px]' : 'left-0.5'}`} />
                        </button>
                        <span className={`font-semibold ${data.is_open ? 'text-white' : 'text-gray-500'}`}>{data.is_open ? 'Available this day' : 'Day off'}</span>
                    </div>

                    {data.is_open && (
                        <div className="flex items-center gap-2 text-sm text-gray-300">
                            <input type="time" value={data.start_time} onChange={(e) => setData('start_time', e.target.value)}
                                className="rounded-lg border-white/10 bg-ink px-3 py-1.5 text-white focus:border-gold focus:ring-gold" />
                            <span className="text-gray-500">to</span>
                            <input type="time" value={data.end_time} onChange={(e) => setData('end_time', e.target.value)}
                                className="rounded-lg border-white/10 bg-ink px-3 py-1.5 text-white focus:border-gold focus:ring-gold" />
                        </div>
                    )}
                    {errors.end_time && <p className="text-xs text-red-400">{errors.end_time}</p>}

                    <div className="flex items-center justify-between gap-3 pt-1">
                        {hasOverride ? (
                            <button type="button" onClick={revert} className="text-xs font-semibold text-gray-400 hover:text-white">↺ Use weekly hours</button>
                        ) : <span />}
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="rounded-full px-4 py-2 text-sm font-semibold text-gray-400 hover:text-white">Cancel</button>
                            <button type="submit" disabled={processing} className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-ink hover:bg-gold-300 disabled:opacity-60">Save</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function Bookings({ bookings, counts, availability }) {
    const { flash } = usePage().props;

    const focusId = Number(new URLSearchParams(window.location.search).get('booking')) || null;
    const focused = bookings.find((b) => b.id === focusId) || null;

    const [detail, setDetail] = useState(focused);
    const [availDay, setAvailDay] = useState(null);

    const byDate = useMemo(() => {
        const map = {};
        bookings.forEach((b) => { (map[b.date] ??= []).push(b); });
        Object.values(map).forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
        return map;
    }, [bookings]);

    // Effective availability for a date: an override wins over the weekly pattern.
    const weeklyByDay = useMemo(() => Object.fromEntries((availability?.weekly || []).map((w) => [w.day, w])), [availability]);
    const overrideByDate = useMemo(() => Object.fromEntries((availability?.dates || []).map((d) => [d.date, d])), [availability]);

    const effective = (dateStr) => {
        if (overrideByDate[dateStr]) return { ...overrideByDate[dateStr], source: 'override' };
        const dow = new Date(dateStr + 'T00:00:00').getDay();
        const w = weeklyByDay[dow] || { is_open: false, start_time: '09:00', end_time: '17:00' };
        return { ...w, source: 'weekly' };
    };

    const accept = (b) => router.patch(route('bookings.confirm', b.id), {}, { preserveScroll: true, onSuccess: () => setDetail(null) });
    const decline = (b) => { if (window.confirm('Decline this call request?')) router.patch(route('bookings.decline', b.id), {}, { preserveScroll: true, onSuccess: () => setDetail(null) }); };

    const openAvail = (dateStr, label) => {
        const e = effective(dateStr);
        setAvailDay({ date: dateStr, label, is_open: e.is_open, start_time: e.start_time || '09:00', end_time: e.end_time || '17:00', source: e.source });
    };

    const renderDay = (dateStr, { isPast }) => {
        const list = byDate[dateStr] || [];
        const av = effective(dateStr);
        const label = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        return (
            <>
                {list.slice(0, 2).map((b) => (
                    <button key={b.id} onClick={() => setDetail(b)} title={`${b.time} · ${b.client} · ${b.topic}`}
                        className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-semibold leading-tight transition hover:brightness-125 ${STATUS[b.status]?.block}`}>
                        {b.time} {b.client}
                    </button>
                ))}
                {list.length > 2 && <p className="px-1 text-[10px] text-gray-500">+{list.length - 2} more</p>}

                {!isPast && (
                    <button onClick={() => openAvail(dateStr, label)}
                        title={av.source === 'override' ? 'Custom hours — click to edit' : 'Weekly hours — click to customise'}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[10px] font-semibold transition hover:brightness-125 ${
                            av.is_open ? 'text-green-400 hover:bg-green-500/10' : 'text-gray-600 hover:bg-white/5'
                        } ${av.source === 'override' ? 'ring-1 ring-inset ring-gold/40' : ''}`}>
                        {av.is_open ? `● ${av.start_time}–${av.end_time}` : '○ off'}
                    </button>
                )}
            </>
        );
    };

    return (
        <PanelLayout title="Bookings">
            <Head title="Bookings" />

            {flash?.success && (
                <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">{flash.success}</div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white">Call schedule</h2>
                    <p className="mt-1 text-sm text-gray-400">Click a day's <span className="text-green-400">● hours</span> tag to set when you're free that date.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-2">
                        <span className="text-xl font-black text-gold">{counts.pending}</span>
                        <span className="ml-2 text-xs text-gray-400">pending</span>
                    </div>
                    <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-2">
                        <span className="text-xl font-black text-green-300">{counts.confirmed}</span>
                        <span className="ml-2 text-xs text-gray-400">confirmed</span>
                    </div>
                </div>
            </div>

            <CalendarMonth initialDate={focused?.date} renderDay={renderDay} />

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                {Object.entries(STATUS).map(([key, s]) => (
                    <span key={key} className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />{s.label}</span>
                ))}
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-400" />Open day</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full ring-1 ring-gold/60" />Custom date</span>
            </div>

            {/* Booking detail modal */}
            {detail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDetail(null)}>
                    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS[detail.status]?.badge}`}>{STATUS[detail.status]?.label}</span>
                            {detail.is_past && <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-400">Past</span>}
                        </div>
                        <h3 className="mt-3 text-lg font-bold text-white">{detail.topic}</h3>
                        <div className="mt-3 space-y-1.5 text-sm text-gray-300">
                            <p>👤 {detail.client}</p>
                            <p>🕑 {detail.when}–{detail.ends}</p>
                            {detail.email && <p>✉ <a href={`mailto:${detail.email}`} className="hover:text-gold">{detail.email}</a></p>}
                        </div>
                        {detail.note && <p className="mt-3 rounded-xl border border-white/10 bg-ink-700 p-3 text-sm text-gray-300">{detail.note}</p>}
                        <div className="mt-5 flex justify-end gap-3">
                            {detail.status === 'pending' ? (
                                <>
                                    <button onClick={() => decline(detail)} className="rounded-full bg-red-500/10 px-5 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20">✕ Decline</button>
                                    <button onClick={() => accept(detail)} className="rounded-full bg-green-500/15 px-5 py-2 text-sm font-semibold text-green-300 hover:bg-green-500/25">✓ Confirm</button>
                                </>
                            ) : (
                                <button onClick={() => setDetail(null)} className="rounded-full bg-white/5 px-5 py-2 text-sm font-semibold text-gray-300 hover:bg-white/10">Close</button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {availDay && <AvailabilityDayModal day={availDay} onClose={() => setAvailDay(null)} />}
        </PanelLayout>
    );
}
