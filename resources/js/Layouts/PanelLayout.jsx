import { Link, usePage } from '@inertiajs/react';

function NavItem({ href, active, badge, children }) {
    return (
        <Link
            href={href}
            className={`relative rounded-full px-4 py-2 text-sm font-medium transition ${
                active ? 'bg-gold text-ink' : 'text-gray-300 hover:text-gold'
            }`}
        >
            {children}
            {badge > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
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
    const current = route().current();

    return (
        <div className="min-h-screen bg-ink text-white">
            <header className="border-b border-white/5 bg-ink-800">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                    <Link href={route('home')} className="text-lg font-black tracking-widest text-white">
                        TAHA<span className="text-gold">.</span>
                    </Link>

                    <nav className="flex items-center gap-1 sm:gap-2">
                        <NavItem href={route('home')}>Home</NavItem>
                        <NavItem href={route('dashboard')} active={current === 'dashboard'}>
                            Dashboard
                        </NavItem>
                        <NavItem href={route('chat.index')} active={current?.startsWith('chat')} badge={unread}>
                            Chat
                        </NavItem>
                        {user?.role === 'freelancer' && (
                            <>
                                <NavItem href={route('payments.index')} active={current?.startsWith('payments')}>
                                    Payments
                                </NavItem>
                                <NavItem href={route('payment.settings')} active={current?.startsWith('payment.settings')}>
                                    Get Paid
                                </NavItem>
                                <NavItem href={route('contact.index')} active={current?.startsWith('contact')}>
                                    Inbox
                                </NavItem>
                                <NavItem href={route('moderation.index')} active={current?.startsWith('moderation')}>
                                    Blocked
                                </NavItem>
                                <NavItem href={route('cv.edit')} active={current?.startsWith('cv')}>
                                    Manage CV
                                </NavItem>
                            </>
                        )}
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="ml-1 rounded-full border border-white/15 px-4 py-2 text-sm text-gray-300 transition hover:border-red-400 hover:text-red-400"
                        >
                            Logout
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-6xl px-6 py-10">
                {title && <h1 className="mb-8 text-2xl font-extrabold text-white">{title}</h1>}
                {children}
            </main>
        </div>
    );
}
