import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

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
                                    <span className="mt-0.5 text-lg">{n.icon}</span>
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
