import CalendarMonth from '@/Components/CalendarMonth';
import PanelLayout from '@/Layouts/PanelLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const STATUS = {
    pending: { label: 'Pending', dot: 'bg-gold', block: 'bg-gold/20 border-gold/40 text-gold', badge: 'bg-gold/15 text-gold' },
    confirmed: { label: 'Confirmed', dot: 'bg-green-400', block: 'bg-green-500/20 border-green-500/40 text-green-200', badge: 'bg-green-500/15 text-green-300' },
    declined: { label: 'Declined', dot: 'bg-red-400', block: 'bg-red-500/20 border-red-500/40 text-red-200', badge: 'bg-red-500/15 text-red-300' },
    cancelled: { label: 'Cancelled', dot: 'bg-gray-400', block: 'bg-white/10 border-white/20 text-gray-300', badge: 'bg-white/10 text-gray-400' },
};

export default function Bookings({ bookings, counts }) {
    const { flash } = usePage().props;

    // Deep-link: a notification points here with ?booking=ID → open it and jump to its month.
    const focusId = Number(new URLSearchParams(window.location.search).get('booking')) || null;
    const focused = bookings.find((b) => b.id === focusId) || null;

    const [detail, setDetail] = useState(focused);

    // Group bookings by day for the calendar cells.
    const byDate = useMemo(() => {
        const map = {};
        bookings.forEach((b) => { (map[b.date] ??= []).push(b); });
        Object.values(map).forEach((list) => list.sort((a, b) => a.time.localeCompare(b.time)));
        return map;
    }, [bookings]);

    const accept = (b) => router.patch(route('bookings.confirm', b.id), {}, { preserveScroll: true, onSuccess: () => setDetail(null) });
    const decline = (b) => { if (window.confirm('Decline this call request?')) router.patch(route('bookings.decline', b.id), {}, { preserveScroll: true, onSuccess: () => setDetail(null) }); };

    const renderDay = (dateStr) => {
        const list = byDate[dateStr] || [];
        return list.slice(0, 3).map((b) => (
            <button
                key={b.id}
                onClick={() => setDetail(b)}
                title={`${b.time} · ${b.client} · ${b.topic}`}
                className={`block w-full truncate rounded border px-1.5 py-0.5 text-left text-[10px] font-semibold leading-tight transition hover:brightness-125 ${STATUS[b.status]?.block}`}
            >
                {b.time} {b.client}
            </button>
        )).concat(
            list.length > 3
                ? [<p key="more" className="px-1 text-[10px] text-gray-500">+{list.length - 3} more</p>]
                : [],
        );
    };

    return (
        <PanelLayout title="Bookings">
            <Head title="Bookings" />

            {flash?.success && (
                <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">{flash.success}</div>
            )}

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-2xl font-black text-white">Call schedule</h2>
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

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-400">
                {Object.entries(STATUS).map(([key, s]) => (
                    <span key={key} className="flex items-center gap-1.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />{s.label}
                    </span>
                ))}
            </div>

            {/* Detail modal */}
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
        </PanelLayout>
    );
}
