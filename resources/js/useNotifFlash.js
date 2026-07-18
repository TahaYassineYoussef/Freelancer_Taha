import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * When a notification deep-links here with ?{param}=ID, scroll to the element
 * `#{prefix}-{ID}` and restart a strong gold flash on it.
 *
 * - Reads the live URL (window.location.search), which always reflects the
 *   current query after an Inertia visit — more reliable than page.url.
 * - Retries briefly in case the target card hasn't painted yet.
 * - Depends on page.url so repeated clicks (nonce-busted) re-trigger the flash.
 */
export default function useNotifFlash(prefix, param = 'task') {
    const page = usePage();

    useEffect(() => {
        const id = new URLSearchParams(window.location.search).get(param);
        if (!id) return;

        let tries = 0;
        let timer;

        const run = () => {
            const el = document.getElementById(`${prefix}-${id}`);
            if (!el) {
                if (tries++ < 12) timer = setTimeout(run, 60); // wait for render
                return;
            }
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Restart the CSS animation reliably: remove, force reflow, re-add.
            el.classList.remove('notif-flash');
            void el.offsetWidth;
            el.classList.add('notif-flash');
            timer = setTimeout(() => el.classList.remove('notif-flash'), 1900);
        };

        run();
        return () => clearTimeout(timer);
    }, [page.url]);
}
