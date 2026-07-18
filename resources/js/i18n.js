import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Returns a translator `t(key, fallback?)` bound to the active locale's
 * messages (shared from the server). Falls back to the key itself (English).
 */
export function useT() {
    const { translations } = usePage().props;
    return (key, fallback) => (translations && translations[key]) || fallback || key;
}

export function useLocale() {
    return usePage().props.locale || 'en';
}

/**
 * Keeps <html lang/dir> in sync with the active locale so Arabic renders
 * right-to-left. Call once from a top-level layout/page.
 */
export function useApplyDirection() {
    const { locale, dir } = usePage().props;
    useEffect(() => {
        const el = document.documentElement;
        el.setAttribute('lang', locale || 'en');
        el.setAttribute('dir', dir || 'ltr');
    }, [locale, dir]);
}
