import { router } from '@inertiajs/react';
import { useState } from 'react';

const inputCls =
    'w-full rounded-lg border border-white/10 bg-ink px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-gold focus:ring-gold';

function emptyValues(fields) {
    const out = {};
    fields.forEach((f) => {
        out[f.name] = f.type === 'checkbox' ? false : '';
    });
    return out;
}

function ItemForm({ fields, initial, onSubmit, onCancel, submitLabel }) {
    const [values, setValues] = useState(initial);

    const set = (name, value) => setValues((v) => ({ ...v, [name]: value }));

    const submit = (e) => {
        e.preventDefault();
        onSubmit(values);
    };

    return (
        <form onSubmit={submit} className="space-y-3 rounded-xl border border-white/10 bg-ink-800 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
                {fields.map((f) => {
                    if (f.type === 'checkbox') {
                        return (
                            <label key={f.name} className="flex items-center gap-2 text-sm text-gray-300 sm:col-span-2">
                                <input
                                    type="checkbox"
                                    checked={!!values[f.name]}
                                    onChange={(e) => set(f.name, e.target.checked)}
                                    className="rounded border-white/20 bg-ink text-gold focus:ring-gold"
                                />
                                {f.label}
                            </label>
                        );
                    }
                    const full = f.type === 'textarea';
                    return (
                        <label key={f.name} className={`block ${full ? 'sm:col-span-2' : ''}`}>
                            <span className="mb-1 block text-xs font-medium text-gray-400">{f.label}</span>
                            {full ? (
                                <textarea
                                    rows={3}
                                    value={values[f.name] ?? ''}
                                    onChange={(e) => set(f.name, e.target.value)}
                                    className={inputCls}
                                />
                            ) : (
                                <input
                                    type={f.type}
                                    value={values[f.name] ?? ''}
                                    onChange={(e) => set(f.name, e.target.value)}
                                    className={inputCls}
                                />
                            )}
                        </label>
                    );
                })}
            </div>
            <div className="flex gap-2">
                <button type="submit" className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-300">
                    {submitLabel}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel} className="rounded-full border border-white/15 px-5 py-2 text-sm text-gray-300 hover:text-white">
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

export default function CollectionManager({ title, items, fields, storeRoute, updateRoute, destroyRoute, summary }) {
    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const create = (values) => {
        router.post(route(storeRoute), values, {
            preserveScroll: true,
            onSuccess: () => setAdding(false),
        });
    };

    const update = (id, values) => {
        router.patch(route(updateRoute, id), values, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    const remove = (id) => {
        if (confirm('Delete this item?')) {
            router.delete(route(destroyRoute, id), { preserveScroll: true });
        }
    };

    const toInitial = (item) => {
        const out = {};
        fields.forEach((f) => {
            let value = item[f.name] ?? (f.type === 'checkbox' ? false : '');
            // <input type="date"> needs a yyyy-MM-dd value, but dates arrive as ISO strings.
            if (f.type === 'date' && typeof value === 'string' && value.length > 10) {
                value = value.slice(0, 10);
            }
            out[f.name] = value;
        });
        return out;
    };

    return (
        <section className="rounded-2xl border border-white/5 bg-ink-700 p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">{title}</h2>
                <button
                    onClick={() => {
                        setAdding((a) => !a);
                        setEditingId(null);
                    }}
                    className="rounded-full bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-300"
                >
                    {adding ? 'Close' : '+ Add'}
                </button>
            </div>

            {adding && (
                <div className="mb-5">
                    <ItemForm
                        fields={fields}
                        initial={emptyValues(fields)}
                        onSubmit={create}
                        onCancel={() => setAdding(false)}
                        submitLabel="Save"
                    />
                </div>
            )}

            <div className="space-y-3">
                {items.length === 0 && <p className="text-sm text-gray-500">Nothing added yet.</p>}
                {items.map((item) =>
                    editingId === item.id ? (
                        <ItemForm
                            key={item.id}
                            fields={fields}
                            initial={toInitial(item)}
                            onSubmit={(values) => update(item.id, values)}
                            onCancel={() => setEditingId(null)}
                            submitLabel="Update"
                        />
                    ) : (
                        <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/5 bg-ink-800 p-4">
                            <div className="min-w-0">{summary(item)}</div>
                            <div className="flex flex-shrink-0 gap-3 text-sm">
                                <button
                                    onClick={() => {
                                        setEditingId(item.id);
                                        setAdding(false);
                                    }}
                                    className="text-gold hover:text-gold-300"
                                >
                                    Edit
                                </button>
                                <button onClick={() => remove(item.id)} className="text-red-400 hover:text-red-300">
                                    Delete
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </section>
    );
}
