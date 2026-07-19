import { useT } from '@/i18n';
import { useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function pad(n) {
    return String(n).padStart(2, '0');
}

function ymd(year, month, day) {
    return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function todayStr() {
    const d = new Date();
    return ymd(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * A month-grid calendar (Sun–Sat) with prev/next/today navigation.
 * The parent supplies `renderDay(dateStr, { day, isToday, isPast })` which returns
 * the content shown inside that day's cell (usually event blocks).
 *
 * `initialDate` (a 'YYYY-MM-DD' string) sets which month opens first.
 */
export default function CalendarMonth({ renderDay, initialDate }) {
    const t = useT();
    const start = initialDate ? new Date(initialDate + 'T00:00:00') : new Date();
    const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() });

    const first = new Date(view.year, view.month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const today = todayStr();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const go = (delta) => {
        setView((v) => {
            const m = v.month + delta;
            return { year: v.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
        });
    };
    const goToday = () => {
        const d = new Date();
        setView({ year: d.getFullYear(), month: d.getMonth() });
    };

    // Year options: a generous range around now, always including the current view.
    const thisYear = new Date().getFullYear();
    const years = [];
    const from = Math.min(thisYear - 1, view.year);
    const to = Math.max(thisYear + 6, view.year);
    for (let y = from; y <= to; y++) years.push(y);

    const selectCls = 'rounded-lg border border-white/15 bg-ink-800 px-2 py-1.5 text-sm font-bold text-white focus:border-gold focus:ring-gold';

    return (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-ink-700">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-1.5">
                    <button onClick={() => go(-1)} className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-gold" aria-label="Previous month">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => go(1)} className="rounded-lg p-2 text-gray-300 hover:bg-white/10 hover:text-gold" aria-label="Next month">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <select value={view.month} onChange={(e) => setView((v) => ({ ...v, month: Number(e.target.value) }))} className={selectCls} aria-label="Month">
                        {MONTHS.map((m, i) => <option key={m} value={i} className="bg-ink-800 text-white">{t(m)}</option>)}
                    </select>
                    <select value={view.year} onChange={(e) => setView((v) => ({ ...v, year: Number(e.target.value) }))} className={selectCls} aria-label="Year">
                        {years.map((y) => <option key={y} value={y} className="bg-ink-800 text-white">{y}</option>)}
                    </select>
                </div>
                <button onClick={goToday} className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-gray-200 hover:border-gold hover:text-gold">{t('Today')}</button>
            </div>

            {/* Weekday row */}
            <div className="grid grid-cols-7 border-b border-white/10 bg-ink-800">
                {WEEKDAYS.map((w) => (
                    <div key={w} className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">{t(w)}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7">
                {cells.map((day, i) => {
                    if (day === null) {
                        return <div key={`e${i}`} className="min-h-[92px] border-b border-r border-white/5 bg-ink-800/40 last:border-r-0" />;
                    }
                    const dateStr = ymd(view.year, view.month, day);
                    const isToday = dateStr === today;
                    const isPast = dateStr < today;
                    return (
                        <div
                            key={dateStr}
                            className={`min-h-[92px] border-b border-r border-white/5 p-1.5 [&:nth-child(7n)]:border-r-0 ${isPast ? 'bg-ink-800/30' : ''}`}
                        >
                            <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-gold text-ink' : isPast ? 'text-gray-600' : 'text-gray-300'}`}>
                                {day}
                            </div>
                            <div className="space-y-1">{renderDay(dateStr, { day, isToday, isPast })}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
