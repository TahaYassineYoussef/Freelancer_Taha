import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * When a notification deep-links here with ?task=ID, scroll to the element
 * `#{prefix}-{ID}` and restart a strong gold flash on it.
 *
 * The bell adds a nonce (?_=timestamp) on every click, so page.url changes each
 * time — this effect re-runs and re-triggers the flash even on repeated clicks
 * of the same notification.
 */
export default function useNotifFlash(prefix) {
    const page = usePage();

    useEffect(() => {
        const id = new URLSearchParams(page.url.split('?')[1] || '').get('task');
        if (!id) return;

        const el = document.getElementById(`${prefix}-${id}`);
        if (!el) return;

        el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Restart the CSS animation reliably: remove, force reflow, re-add.
        el.classList.remove('notif-flash');
        void el.offsetWidth;
        el.classList.add('notif-flash');

        const t = setTimeout(() => el.classList.remove('notif-flash'), 1900);
        return () => clearTimeout(t);
    }, [page.url]);
}
