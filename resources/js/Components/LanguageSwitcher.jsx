import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const LANGS = [
    { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
    { code: 'fr', label: 'Français', short: 'FR', flag: '🇫🇷' },
    { code: 'ar', label: 'العربية', short: 'ع', flag: '🇹🇳' },
];

export default function LanguageSwitcher() {
    const { locale } = usePage().props;
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    const pick = (code) => {
        setOpen(false);
        if (code !== locale) router.post(route('locale.update', code), {}, { preserveScroll: true, preserveState: false });
    };

    const cur = LANGS.find((l) => l.code === locale) || LANGS[0];

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm font-semibold text-gray-200 transition hover:border-gold hover:text-gold"
                aria-label="Change language"
            >
                <span className="text-base leading-none">{cur.flag}</span>
                <span>{cur.short}</span>
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>

            {open && (
                <div className="absolute right-0 z-[70] mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-ink-800 shadow-xl">
                    {LANGS.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => pick(l.code)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition ${l.code === locale ? 'bg-gold/10 text-gold' : 'text-gray-200 hover:bg-white/5'}`}
                        >
                            <span className="text-base leading-none">{l.flag}</span>
                            {l.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
