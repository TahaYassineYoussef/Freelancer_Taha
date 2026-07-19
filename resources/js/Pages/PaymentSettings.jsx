import PanelLayout from '@/Layouts/PanelLayout';
import { useT } from '@/i18n';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const inputCls =
    'w-full rounded-lg border border-white/10 bg-ink px-4 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:ring-gold';

export default function PaymentSettings({ settings, d17QrUrl, envPaypalClientId, paypalMode, currency }) {
    const t = useT();
    const [data, setData] = useState({
        paypal_email: settings.paypal_email ?? '',
        paypal_client_id: settings.paypal_client_id ?? '',
        paypal_enabled: settings.paypal_enabled ?? true,
        d17_number: settings.d17_number ?? '',
        d17_enabled: settings.d17_enabled ?? true,
    });
    const [qr, setQr] = useState(null);
    const [preview, setPreview] = useState(null);
    const [errors, setErrors] = useState({});
    const [saved, setSaved] = useState(false);
    const [processing, setProcessing] = useState(false);

    const set = (k, v) => setData((s) => ({ ...s, [k]: v }));

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route('payment.settings.update'),
            // Booleans must go over FormData as 1/0 for Laravel's `boolean` rule.
            { ...data, paypal_enabled: data.paypal_enabled ? 1 : 0, d17_enabled: data.d17_enabled ? 1 : 0, d17_qr: qr },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setSaved(true);
                    setQr(null);
                    setErrors({});
                    setTimeout(() => setSaved(false), 2500);
                },
                onError: (e) => setErrors(e),
                onFinish: () => setProcessing(false),
            }
        );
    };

    const paypalReady = !!data.paypal_client_id || envPaypalClientId;

    return (
        <PanelLayout title="Payment Settings">
            <Head title="Payment Settings" />

            <p className="mb-6 max-w-2xl text-sm text-gray-400">
                {t('This is where your money arrives. Clients pay you with PayPal or D17 — whatever you fill in here is what they see and pay into.')}
            </p>

            <form onSubmit={submit} className="max-w-3xl space-y-6">
                {saved && (
                    <p className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400">
                        {t('Payment settings saved.')}
                    </p>
                )}

                {/* PayPal */}
                <section className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-white">PayPal</h2>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Show / hide the button for clients — credentials are kept either way. */}
                            <button
                                type="button"
                                onClick={() => set('paypal_enabled', !data.paypal_enabled)}
                                className="flex items-center gap-2"
                                aria-pressed={data.paypal_enabled}
                                title={data.paypal_enabled ? t('Clients can pay with PayPal') : t('The PayPal button is hidden from clients')}
                            >
                                <span className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${data.paypal_enabled ? 'bg-gold' : 'bg-white/15'}`}>
                                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${data.paypal_enabled ? 'left-[22px]' : 'left-0.5'}`} />
                                </span>
                                <span className={`text-xs font-semibold ${data.paypal_enabled ? 'text-gold' : 'text-gray-500'}`}>
                                    {data.paypal_enabled ? t('Shown to clients') : t('Hidden from clients')}
                                </span>
                            </button>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${paypalReady ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                                {paypalReady ? `${t('Active')} · ${paypalMode}` : t('Not configured')}
                            </span>
                        </div>
                    </div>

                    {!data.paypal_enabled && (
                        <p className="mb-4 rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-xs text-gray-400">
                            {t('The PayPal button is hidden — clients only see D17. Your details below are still saved; switch it back on anytime.')}
                        </p>
                    )}

                    <div className="space-y-4">
                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-gray-400">
                                {t('PayPal account email (where the money lands)')}
                            </span>
                            <input
                                type="email"
                                value={data.paypal_email}
                                onChange={(e) => set('paypal_email', e.target.value)}
                                className={inputCls}
                                placeholder="you@example.com"
                            />
                            {errors.paypal_email && <span className="mt-1 block text-sm text-red-400">{errors.paypal_email}</span>}
                        </label>

                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-gray-400">
                                {t('PayPal Client ID')}
                            </span>
                            <input
                                type="text"
                                value={data.paypal_client_id}
                                onChange={(e) => set('paypal_client_id', e.target.value)}
                                className={`${inputCls} font-mono text-xs`}
                                placeholder="AR3fOTJERpZa4O2UJIfJuWHk..."
                            />
                            {errors.paypal_client_id && <span className="mt-1 block text-sm text-red-400">{errors.paypal_client_id}</span>}
                            <span className="mt-1 block text-xs text-gray-500">
                                {t('From developer.paypal.com → Apps & Credentials. This renders the PayPal button for clients. Currency:')} <span className="text-gold">{currency}</span>.
                                {envPaypalClientId && !data.paypal_client_id && (
                                    <> {t('Currently using the Client ID from your')} <code className="text-gray-400">.env</code> {t('file — enter one here to override it.')}</>
                                )}
                            </span>
                        </label>
                    </div>
                </section>

                {/* D17 */}
                <section className="rounded-2xl border border-white/5 bg-ink-700 p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-white">D17 <span className="text-sm font-normal text-gray-500">(DigiPost)</span></h2>
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Show / hide the D17 button for clients — details are kept either way. */}
                            <button
                                type="button"
                                onClick={() => set('d17_enabled', !data.d17_enabled)}
                                className="flex items-center gap-2"
                                aria-pressed={data.d17_enabled}
                                title={data.d17_enabled ? t('Clients can pay with D17') : t('The D17 button is hidden from clients')}
                            >
                                <span className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${data.d17_enabled ? 'bg-gold' : 'bg-white/15'}`}>
                                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${data.d17_enabled ? 'left-[22px]' : 'left-0.5'}`} />
                                </span>
                                <span className={`text-xs font-semibold ${data.d17_enabled ? 'text-gold' : 'text-gray-500'}`}>
                                    {data.d17_enabled ? t('Shown to clients') : t('Hidden from clients')}
                                </span>
                            </button>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${data.d17_number ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                                {data.d17_number ? t('Active') : t('Not configured')}
                            </span>
                        </div>
                    </div>

                    {!data.d17_enabled && (
                        <p className="mb-4 rounded-xl border border-white/10 bg-ink-800 px-4 py-3 text-xs text-gray-400">
                            {t('The D17 button is hidden — your wallet details below are still saved; switch it back on anytime.')}
                        </p>
                    )}

                    <div className="space-y-4">
                        <label className="block">
                            <span className="mb-1 block text-xs font-medium text-gray-400">{t('D17 wallet number')}</span>
                            <input
                                type="text"
                                value={data.d17_number}
                                onChange={(e) => set('d17_number', e.target.value)}
                                className={inputCls}
                                placeholder="27617930"
                            />
                            {errors.d17_number && <span className="mt-1 block text-sm text-red-400">{errors.d17_number}</span>}
                            <span className="mt-1 block text-xs text-gray-500">
                                {t('Shown to clients in the “Pay with D17” popup. They send here, then you confirm it under Payments.')}
                            </span>
                        </label>

                        <div className="flex items-center gap-5 rounded-xl border border-white/10 bg-ink-800 p-4">
                            {(preview ?? d17QrUrl) ? (
                                <img src={preview ?? d17QrUrl} alt="D17 QR" className="h-24 w-24 rounded-lg bg-white p-1" />
                            ) : (
                                <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-white/20 text-center text-xs text-gray-500">
                                    {t('No QR yet')}
                                </div>
                            )}
                            <label className="cursor-pointer">
                                <span className="mb-1 block text-xs font-medium text-gray-400">{t('D17 QR code (optional)')}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const f = e.target.files[0] ?? null;
                                        setQr(f);
                                        setPreview(f ? URL.createObjectURL(f) : null);
                                    }}
                                    className="block text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-[#31a9e0] file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
                                />
                                <span className="mt-1 block text-xs text-gray-500">{t('Clients can scan this in the D17 app.')}</span>
                            </label>
                        </div>
                    </div>
                </section>

                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-gold-300 disabled:opacity-60"
                >
                    {processing ? t('Saving…') : t('Save payment settings')}
                </button>
            </form>
        </PanelLayout>
    );
}
