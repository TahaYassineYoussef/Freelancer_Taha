import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

// Solid glyphs so notification rows match the rest of the icon set.
const P = {
    mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    chat: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z',
    task: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    phone: 'M6.62 10.79a15.53 15.53 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24 11.36 11.36 0 003.57.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z',
    video: 'M17 10.5V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h12a1 1 0 001-1v-3.5l4 4v-11l-4 4z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    calendar: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7v-5z',
    revise: 'M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z',
};

function iconFor(n) {
    if (n.type === 'call') {
        return { d: (n.icon || '').includes('📹') ? P.video : P.phone, cls: 'bg-red-500/15 text-red-300' };
    }
    const map = {
        contact: [P.mail, 'bg-blue-500/15 text-blue-300'],
        message: [P.chat, 'bg-gold/15 text-gold'],
        task: [P.task, 'bg-green-500/15 text-green-300'],
        review: [P.star, 'bg-gold/15 text-gold'],
        booking: [P.calendar, 'bg-purple-500/15 text-purple-300'],
        revision: [P.revise, 'bg-orange-500/15 text-orange-300'],
    };
    const [d, cls] = map[n.type] || [P.chat, 'bg-white/10 text-gray-300'];
    return { d, cls };
}

function timeAgo(value) {
    if (!value) return '';
    const s = Math.floor((Date.now() - new Date(value).getTime()) / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

export default function NotificationBell() {
    const { auth } = usePage().props;
    const data = auth?.notifications ?? { unread: 0, items: [] };
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const openItem = (n) => {
        setOpen(false);

        // Mark read in the background (plain XHR so it doesn't cancel the visit).
        if (!n.read) {
            window.axios.post(route('notifications.read', n.id)).catch(() => {});
        }

        // Always navigate — even on repeated clicks of the same notification —
        // by adding a fresh nonce so the destination re-runs its scroll/highlight.
        const sep = n.url.includes('?') ? '&' : '?';
        router.visit(`${n.url}${sep}_=${Date.now()}`);
    };

    const markAll = () => {
        router.post(route('notifications.readAll'), {}, { preserveScroll: true, preserveState: true });
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="relative rounded-full p-2 text-gray-300 transition hover:bg-white/5 hover:text-gold"
                aria-label="Notifications"
            >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                </svg>
                {data.unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {data.unread > 9 ? '9+' : data.unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-ink-800 shadow-2xl">
                    <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                        <span className="text-sm font-bold text-white">Notifications</span>
                        {data.unread > 0 && (
                            <button onClick={markAll} className="text-xs text-gold hover:text-gold-300">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {data.items.length === 0 ? (
                            <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet.</p>
                        ) : (
                            data.items.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => openItem(n)}
                                    className={`flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5 ${n.read ? '' : 'bg-gold/5'}`}
                                >
                                    {(() => {
                                        const ic = iconFor(n);
                                        return (
                                            <span className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${ic.cls}`}>
                                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d={ic.d} /></svg>
                                            </span>
                                        );
                                    })()}
                                    <span className="min-w-0 flex-1">
                                        <span className="flex items-center gap-2">
                                            <span className="truncate text-sm font-semibold text-white">{n.title}</span>
                                            {!n.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gold" />}
                                        </span>
                                        <span className="mt-0.5 block text-xs text-gray-400">{n.message}</span>
                                        <span className="mt-1 block text-[10px] text-gray-600">{timeAgo(n.created_at)}</span>
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
