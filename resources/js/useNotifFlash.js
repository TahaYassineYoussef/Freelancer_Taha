import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * When a notification deep-links here with ?{param}=ID, scroll to the element
 * `#{prefix}-{ID}` and flash it gold.
 *
 * The flash is driven by the Web Animations API (el.animate) rather than a CSS
 * class, so it does NOT depend on any cached stylesheet and always runs — and
 * restarts cleanly on every repeated click (the bell adds a ?_=nonce, so
 * page.url changes each time and this effect re-runs).
 */
export default function useNotifFlash(prefix, param = 'task') {
    const page = usePage();

    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get(param);
        if (!id) return;

        let tries = 0;
        let timer;

        const flash = (el) => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Self-contained JS animation — no CSS dependency.
            try {
                el.animate(
                    [
                        { boxShadow: '0 0 0 0 rgba(249,178,51,0)', backgroundColor: 'rgba(249,178,51,0.35)' },
                        { boxShadow: '0 0 0 8px rgba(249,178,51,0.55)', backgroundColor: 'rgba(249,178,51,0.28)', offset: 0.15 },
                        { boxShadow: '0 0 0 3px rgba(249,178,51,0.4)', backgroundColor: 'rgba(249,178,51,0.12)', offset: 0.5 },
                        { boxShadow: '0 0 0 0 rgba(249,178,51,0)', backgroundColor: 'rgba(249,178,51,0)' },
                    ],
                    { duration: 2000, easing: 'ease-out' },
                );
            } catch {
                // Fallback for very old browsers: toggle a class (needs the CSS).
                el.classList.remove('notif-flash');
                void el.offsetWidth;
                el.classList.add('notif-flash');
                timer = setTimeout(() => el.classList.remove('notif-flash'), 1900);
            }
        };

        const run = () => {
            const el = document.getElementById(`${prefix}-${id}`);
            if (!el) {
                if (tries++ < 15) timer = setTimeout(run, 70); // wait for render
                return;
            }
            flash(el);
        };

        run();
        return () => clearTimeout(timer);
    }, [page.url]);
}
