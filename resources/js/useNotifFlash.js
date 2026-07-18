import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * When a notification deep-links here with ?{param}=ID, scroll to the element
 * `#{prefix}-{ID}` and flash it gold.
 *
 * Robustness notes:
 * - Inertia resets scroll to the top on a normal visit, so we delay before
 *   scrolling — otherwise the target scrolls in and immediately jumps back up.
 * - The flash is applied with direct inline styles + a CSS transition, so it
 *   never depends on a cached stylesheet or the Web Animations API.
 * - Retries until the target card is painted, and re-runs on every repeated
 *   click (the bell adds a ?_=nonce, so page.url changes each time).
 */
export default function useNotifFlash(prefix, param = 'task') {
    const page = usePage();

    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get(param);
        if (!id) return;

        let tries = 0;
        let cancelled = false;
        const timers = [];

        const flash = (el) => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });

            const prev = { box: el.style.boxShadow, bg: el.style.backgroundColor, tr: el.style.transition };
            el.style.transition = 'box-shadow .25s ease, background-color .25s ease';
            el.style.boxShadow = '0 0 0 4px #f9b233';
            el.style.backgroundColor = 'rgba(249,178,51,0.22)';

            timers.push(setTimeout(() => {
                el.style.boxShadow = '0 0 0 0 rgba(249,178,51,0)';
                el.style.backgroundColor = '';
            }, 1400));
            timers.push(setTimeout(() => {
                el.style.transition = prev.tr;
                el.style.boxShadow = prev.box;
                el.style.backgroundColor = prev.bg;
            }, 1800));
        };

        const run = () => {
            if (cancelled) return;
            const el = document.getElementById(`${prefix}-${id}`);
            if (!el) {
                if (tries++ < 20) timers.push(setTimeout(run, 80)); // wait for render
                return;
            }
            flash(el);
        };

        // Delay so Inertia's post-visit scroll-reset finishes before we scroll.
        timers.push(setTimeout(run, 150));

        return () => {
            cancelled = true;
            timers.forEach(clearTimeout);
        };
    }, [page.url]);
}
