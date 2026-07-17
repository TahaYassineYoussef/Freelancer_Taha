import { router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function D17Button({ task }) {
    const { d17 } = usePage().props;
    const [open, setOpen] = useState(false);
    const [reference, setReference] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState(null);

    const submit = (e) => {
        e.preventDefault();
        if (!reference.trim()) {
            setError('Please enter your D17 transfer reference.');
            return;
        }
        setProcessing(true);
        setError(null);
        router.post(
            route('payments.d17', task.id),
            { provider_order_id: reference.trim() },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setOpen(false);
                    setReference('');
                },
                onError: (e) => setError(e.provider_order_id ?? 'Something went wrong.'),
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#1e63b0] to-[#31a9e0] px-5 py-2 text-sm font-bold text-white transition hover:opacity-90"
            >
                Pay with D17
            </button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setOpen(false)}>
                    <div
                        className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-800 p-6 text-left"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">Pay with D17</h3>
                            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <p className="mb-4 text-sm text-gray-300">
                            Send <span className="font-bold text-gold">{Number(task.budget).toFixed(2)} TND</span> via the{' '}
                            <span className="font-semibold text-[#31a9e0]">D17</span> app to Taha, then enter your transfer
                            reference below. Taha will confirm once received.
                        </p>

                        <div className="mb-4 rounded-xl border border-white/10 bg-ink-700 p-4">
                            <p className="text-xs uppercase tracking-wide text-gray-400">D17 wallet number</p>
                            <p className="mt-1 select-all text-xl font-black text-white">
                                {d17?.number ?? 'Not set yet'}
                            </p>
                            {d17?.qr && (
                                <img src={d17.qr} alt="D17 QR code" className="mt-3 h-40 w-40 rounded-lg bg-white p-2" />
                            )}
                        </div>

                        <form onSubmit={submit} className="space-y-3">
                            <label className="block">
                                <span className="mb-1 block text-xs font-medium text-gray-400">Your D17 transfer reference</span>
                                <input
                                    type="text"
                                    value={reference}
                                    onChange={(e) => setReference(e.target.value)}
                                    placeholder="e.g. D17-123456789"
                                    className="w-full rounded-lg border border-white/10 bg-ink px-4 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:ring-gold"
                                />
                                {error && <span className="mt-1 block text-sm text-red-400">{error}</span>}
                            </label>
                            <button
                                type="submit"
                                disabled={processing || !d17?.number}
                                className="w-full rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-300 disabled:opacity-60"
                            >
                                {processing ? 'Submitting…' : "I've paid — submit"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
