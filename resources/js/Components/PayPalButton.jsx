import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

// Load the PayPal JS SDK once per (clientId, currency) and reuse the promise.
const loaders = {};
function loadPayPalSdk(clientId, currency) {
    const key = `${clientId}|${currency}`;
    if (loaders[key]) return loaders[key];

    loaders[key] = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}`;
        script.onload = () => resolve(window.paypal);
        script.onerror = reject;
        document.body.appendChild(script);
    });
    return loaders[key];
}

export default function PayPalButton({ task, clientId, currency = 'USD' }) {
    const container = useRef(null);

    useEffect(() => {
        let cancelled = false;

        loadPayPalSdk(clientId, currency)
            .then((paypal) => {
                if (cancelled || !container.current || !paypal) return;
                container.current.innerHTML = '';
                paypal
                    .Buttons({
                        style: { layout: 'horizontal', color: 'gold', shape: 'pill', height: 38, tagline: false },
                        createOrder: (data, actions) =>
                            actions.order.create({
                                purchase_units: [
                                    {
                                        description: `Task: ${task.title}`.slice(0, 127),
                                        amount: { value: Number(task.budget).toFixed(2), currency_code: currency },
                                    },
                                ],
                            }),
                        onApprove: (data, actions) =>
                            actions.order.capture().then((details) => {
                                router.post(
                                    route('payments.store', task.id),
                                    { provider_order_id: details.id ?? data.orderID },
                                    { preserveScroll: true }
                                );
                            }),
                    })
                    .render(container.current);
            })
            .catch(() => {});

        return () => {
            cancelled = true;
        };
    }, [task.id, clientId, currency]);

    return <div ref={container} />;
}
