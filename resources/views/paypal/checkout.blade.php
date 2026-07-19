<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <title>Pay with PayPal</title>
    <style>
        :root { color-scheme: dark; }
        body {
            margin: 0; min-height: 100vh; display: flex; flex-direction: column;
            align-items: center; justify-content: center; gap: 18px; padding: 24px;
            background: #111111; color: #ffffff; font-family: system-ui, -apple-system, Segoe UI, sans-serif;
        }
        h1 { font-size: 18px; margin: 0; text-align: center; font-weight: 700; }
        .amount { font-size: 30px; font-weight: 900; color: #f5b301; }
        .wrap { width: 100%; max-width: 380px; }
        .msg { font-size: 13px; color: #9b9b9b; text-align: center; min-height: 18px; }
    </style>
</head>
<body>
    <h1>{{ $title }}</h1>
    <div class="amount">{{ $amount }} {{ $currency }}</div>
    <div class="wrap"><div id="paypal-button-container"></div></div>
    <div class="msg" id="msg"></div>

    {{-- The SDK is loaded with the freelancer's own client id, passed in by the app. --}}
    <script src="https://www.paypal.com/sdk/js?client-id={{ urlencode($clientId) }}&currency={{ urlencode($currency) }}"></script>
    <script>
        const msg = document.getElementById('msg');

        if (!window.paypal) {
            msg.textContent = 'Could not load PayPal. Check your connection and try again.';
        } else {
            paypal.Buttons({
                createOrder: (data, actions) => actions.order.create({
                    purchase_units: [{
                        amount: { value: @json($amount), currency_code: @json($currency) },
                        description: @json($title),
                    }],
                }),
                onApprove: async (data, actions) => {
                    msg.textContent = 'Confirming payment…';
                    const details = await actions.order.capture();
                    const orderId = (details && details.id) ? details.id : data.orderID;
                    // The Flutter web view watches for this URL and records the
                    // payment against the task through the authenticated API.
                    window.location.href = '/paypal/done?order_id=' + encodeURIComponent(orderId);
                },
                onCancel: () => { window.location.href = '/paypal/done?cancelled=1'; },
                onError: (err) => { msg.textContent = 'Payment failed: ' + err; },
            }).render('#paypal-button-container');
        }
    </script>
</body>
</html>
