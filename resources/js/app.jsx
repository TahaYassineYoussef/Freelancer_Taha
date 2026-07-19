import '../css/app.css';
import './bootstrap';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Google Analytics only counts the first load on a single-page app, so report
// each Inertia navigation as its own page view. No-op when GA isn't configured.
router.on('navigate', (event) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
        page_path: event.detail.page.url,
        page_location: window.location.href,
        page_title: document.title,
    });
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});
