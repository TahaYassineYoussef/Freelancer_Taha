import PanelLayout from '@/Layouts/PanelLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Availability({ schedule }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({ schedule });

    const setRow = (i, key, value) => {
        const next = data.schedule.map((row, idx) => (idx === i ? { ...row, [key]: value } : row));
        setData('schedule', next);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('availability.update'), { preserveScroll: true });
    };

    return (
        <PanelLayout title="Availability">
            <Head title="Availability" />

            <div className="mx-auto max-w-2xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-black text-white">Weekly working hours</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Turn on the days you're available and set your hours. Clients can then request one-hour calls in these slots for the next two weeks.
                    </p>
                </div>

                {flash?.success && (
                    <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                        {flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-3">
                    {data.schedule.map((row, i) => (
                        <div
                            key={row.day}
                            className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 transition ${
                                row.is_open ? 'border-gold/30 bg-ink-700' : 'border-white/5 bg-ink-800'
                            }`}
                        >
                            <label className="flex w-40 cursor-pointer items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRow(i, 'is_open', !row.is_open)}
                                    className={`relative h-6 w-11 flex-shrink-0 rounded-full transition ${row.is_open ? 'bg-gold' : 'bg-white/15'}`}
                                    aria-pressed={row.is_open}
                                >
                                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${row.is_open ? 'left-[22px]' : 'left-0.5'}`} />
                                </button>
                                <span className={`font-semibold ${row.is_open ? 'text-white' : 'text-gray-500'}`}>{row.name}</span>
                            </label>

                            {row.is_open ? (
                                <div className="flex items-center gap-2 text-sm text-gray-300">
                                    <input
                                        type="time"
                                        value={row.start_time}
                                        onChange={(e) => setRow(i, 'start_time', e.target.value)}
                                        className="rounded-lg border-white/10 bg-ink px-3 py-1.5 text-white focus:border-gold focus:ring-gold"
                                    />
                                    <span className="text-gray-500">to</span>
                                    <input
                                        type="time"
                                        value={row.end_time}
                                        onChange={(e) => setRow(i, 'end_time', e.target.value)}
                                        className="rounded-lg border-white/10 bg-ink px-3 py-1.5 text-white focus:border-gold focus:ring-gold"
                                    />
                                </div>
                            ) : (
                                <span className="text-sm text-gray-500">Closed</span>
                            )}

                            {errors[`schedule.${i}.end_time`] && (
                                <span className="w-full text-xs text-red-400">{errors[`schedule.${i}.end_time`]}</span>
                            )}
                        </div>
                    ))}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink transition hover:bg-gold-300 disabled:opacity-60"
                        >
                            {processing ? 'Saving…' : 'Save availability'}
                        </button>
                    </div>
                </form>
            </div>
        </PanelLayout>
    );
}
