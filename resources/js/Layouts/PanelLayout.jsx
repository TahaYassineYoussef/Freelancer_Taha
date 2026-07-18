import NotificationBell from '@/Components/NotificationBell';
import Photo from '@/Components/Photo';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

const ICONS = {
    home: 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10',
    grid: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 13h6v6h-6z',
    chat: 'M8 12h8m-8-4h5M21 12a8 8 0 01-11.5 7.2L3 21l1.8-6.5A8 8 0 1121 12z',
    cash: 'M3 7h18v10H3zM3 10h18M7 14h2',
    wallet: 'M3 7h16a2 2 0 012 2v6a2 2 0 01-2 2H3zM16 12h3',
    mail: 'M3 7l9 6 9-6M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z',
    shield: 'M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z',
    doc: 'M7 3h7l4 4v14H7zM14 3v4h4',
    revise: 'M4 4v6h6M20 20v-6h-6M20 8a8 8 0 00-14.9-2M4 16a8 8 0 0014.9 2',
    box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8',
    star: 'M12 2l3 6.5 7 .9-5 4.9 1.2 7L12 18l-6.4 3.3 1.2-7-5-4.9 7-.9z',
};

function NavIcon({ d }) {
    return (
        <svg className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={d} />
        </svg>
    );
}

function NavItem({ href, icon, active, badge, children, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                active
                    ? 'bg-gold/15 text-gold'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
        >
            {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-gold" />}
            <NavIcon d={icon} />
            <span className="flex-1">{children}</span>
            {badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {badge}
                </span>
            )}
        </Link>
    );
}

export default function PanelLayout({ title, children }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const unread = auth?.unreadMessages ?? 0;
    const pendingRevisions = auth?.pendingRevisions ?? 0;
    const pendingDeliveries = auth?.pendingDeliveries ?? 0;
    const current = route().current();
    const isFreelancer = user?.role === 'freelancer';
    const [open, setOpen] = useState(false);

    const close = () => setOpen(false);

    const nav = (
        <nav className="space-y-1">
            <NavItem href={route('home')} icon={ICONS.home} onClick={close}>Home</NavItem>
            <NavItem href={route('dashboard')} icon={ICONS.grid} active={current === 'dashboard'} onClick={close}>Dashboard</NavItem>
            <NavItem href={route('chat.index')} icon={ICONS.chat} active={current?.startsWith('chat')} badge={unread} onClick={close}>Chat</NavItem>
            {!isFreelancer && (
                <NavItem href={route('deliveries.index')} icon={ICONS.box} active={current?.startsWith('deliveries')} badge={pendingDeliveries} onClick={close}>Deliveries</NavItem>
            )}
            {isFreelancer && (
                <>
                    <NavItem href={route('payments.index')} icon={ICONS.cash} active={current?.startsWith('payments')} onClick={close}>Payments</NavItem>
                    <NavItem href={route('work.index')} icon={ICONS.box} active={current?.startsWith('work')} onClick={close}>Deliveries</NavItem>
                    <NavItem href={route('reviews.index')} icon={ICONS.star} active={current?.startsWith('reviews')} onClick={close}>Reviews</NavItem>
                    <NavItem href={route('payment.settings')} icon={ICONS.wallet} active={current?.startsWith('payment.settings')} onClick={close}>Get Paid</NavItem>
                    <NavItem href={route('revisions.index')} icon={ICONS.revise} active={current?.startsWith('revisions')} badge={pendingRevisions} onClick={close}>Revisions</NavItem>
                    <NavItem href={route('contact.index')} icon={ICONS.mail} active={current?.startsWith('contact')} onClick={close}>Inbox</NavItem>
                    <NavItem href={route('moderation.index')} icon={ICONS.shield} active={current?.startsWith('moderation')} onClick={close}>Blocked</NavItem>
                    <NavItem href={route('cv.edit')} icon={ICONS.doc} active={current?.startsWith('cv')} onClick={close}>Manage CV</NavItem>
                </>
            )}
        </nav>
    );

    return (
        <div className="min-h-screen bg-ink text-white lg:flex">
            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/5 bg-ink-800 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-full flex-col p-4">
                    <Link href={route('home')} className="mb-8 px-2 pt-2 text-xl font-black tracking-widest text-white">
                        TAHA<span className="text-gold">.</span>
                    </Link>
                    {nav}
                    <div className="mt-auto border-t border-white/5 pt-4">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 16l4-4-4-4M21 12H9M13 21H5a2 2 0 01-2-2V5a2 2 0 012-2h8" />
                            </svg>
                            Logout
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Backdrop on mobile */}
            {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={close} />}

            {/* Main column */}
            <div className="flex min-w-0 flex-1 flex-col">
                {/* Top bar */}
                <header className="sticky top-0 z-20 border-b border-white/5 bg-ink/80 backdrop-blur">
                    <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-gray-300 hover:bg-white/5 lg:hidden" aria-label="Open menu">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-lg font-black text-white sm:text-xl">Hi {user?.name?.split(' ')[0]}</h1>
                                <p className="text-xs text-gray-400">{title}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <NotificationBell />
                            <div className="flex items-center gap-2">
                                <Photo
                                    src={isFreelancer ? ['/images/taha.png', '/images/taha.jpg'] : null}
                                    name={user?.name ?? '?'}
                                    rounded="rounded-full"
                                    className="h-9 w-9"
                                />
                                <span className="hidden text-sm font-semibold text-white sm:block">{user?.name}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-5 py-6 sm:px-8">{children}</main>
            </div>
        </div>
    );
}
