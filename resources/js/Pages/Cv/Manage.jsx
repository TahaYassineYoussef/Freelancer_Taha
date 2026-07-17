import CollectionManager from '@/Components/CollectionManager';
import ProjectsManager from '@/Components/ProjectsManager';
import PanelLayout from '@/Layouts/PanelLayout';
import Photo from '@/Components/Photo';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const inputCls =
    'w-full rounded-lg border border-white/10 bg-ink px-4 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:ring-gold';

function ProfileForm({ profile, avatarUrl, d17QrUrl }) {
    const [data, setData] = useState({
        name: profile.name ?? '',
        headline: profile.headline ?? '',
        bio: profile.bio ?? '',
        location: profile.location ?? '',
        phone: profile.phone ?? '',
        d17_number: profile.d17_number ?? '',
    });
    const [avatar, setAvatar] = useState(null);
    const [preview, setPreview] = useState(null);
    const [d17Qr, setD17Qr] = useState(null);
    const [d17Preview, setD17Preview] = useState(null);
    const [saved, setSaved] = useState(false);
    const [processing, setProcessing] = useState(false);

    const set = (k, v) => setData((s) => ({ ...s, [k]: v }));

    const pickAvatar = (file) => {
        setAvatar(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    };

    const pickD17Qr = (file) => {
        setD17Qr(file);
        setD17Preview(file ? URL.createObjectURL(file) : null);
    };

    const submit = (e) => {
        e.preventDefault();
        setProcessing(true);
        router.post(
            route('cv.profile'),
            { ...data, avatar, d17_qr: d17Qr, _method: 'patch' },
            {
                preserveScroll: true,
                forceFormData: true,
                onSuccess: () => {
                    setSaved(true);
                    setAvatar(null);
                    setD17Qr(null);
                    setTimeout(() => setSaved(false), 2500);
                },
                onFinish: () => setProcessing(false),
            }
        );
    };

    return (
        <section className="rounded-2xl border border-white/5 bg-ink-700 p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Profile</h2>
                {saved && <span className="text-sm text-green-400">Saved!</span>}
            </div>

            <form onSubmit={submit} className="space-y-4">
                <div className="flex items-center gap-5">
                    <Photo
                        src={preview ?? avatarUrl ?? ['/images/taha.png', '/images/taha.jpg']}
                        name={data.name}
                        rounded="rounded-full"
                        className="h-20 w-20"
                    />
                    <label className="cursor-pointer">
                        <span className="mb-1 block text-xs font-medium text-gray-400">Profile photo</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => pickAvatar(e.target.files[0] ?? null)}
                            className="block text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-ink hover:file:bg-gold-300"
                        />
                    </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">Name</span>
                        <input value={data.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">Headline</span>
                        <input value={data.headline} onChange={(e) => set('headline', e.target.value)} className={inputCls} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">Location</span>
                        <input value={data.location} onChange={(e) => set('location', e.target.value)} className={inputCls} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">Phone</span>
                        <input value={data.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">D17 wallet number</span>
                        <input value={data.d17_number} onChange={(e) => set('d17_number', e.target.value)} className={inputCls} placeholder="e.g. 27617930" />
                    </label>
                </div>

                <div className="flex items-center gap-5 rounded-xl border border-white/10 bg-ink-800 p-4">
                    {(d17Preview ?? d17QrUrl) ? (
                        <img src={d17Preview ?? d17QrUrl} alt="D17 QR" className="h-20 w-20 rounded-lg bg-white p-1" />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-gray-500">
                            No QR
                        </div>
                    )}
                    <label className="cursor-pointer">
                        <span className="mb-1 block text-xs font-medium text-gray-400">D17 QR code (optional)</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => pickD17Qr(e.target.files[0] ?? null)}
                            className="block text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-[#31a9e0] file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
                        />
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-400">Bio</span>
                    <textarea rows={4} value={data.bio} onChange={(e) => set('bio', e.target.value)} className={inputCls} />
                </label>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink hover:bg-gold-300 disabled:opacity-60"
                >
                    Save Profile
                </button>
            </form>
        </section>
    );
}

function TestimonialsModerator({ testimonials }) {
    const setApproved = (t, approved) => {
        router.patch(route('testimonials.review', t.id), { approved }, { preserveScroll: true });
    };

    const remove = (t) => {
        if (confirm('Delete this review?')) {
            router.delete(route('testimonials.destroy', t.id), { preserveScroll: true });
        }
    };

    const pending = testimonials.filter((t) => !t.approved).length;

    return (
        <section className="rounded-2xl border border-white/5 bg-ink-700 p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Client Reviews</h2>
                {pending > 0 && (
                    <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
                        {pending} awaiting approval
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {testimonials.length === 0 && <p className="text-sm text-gray-500">No reviews yet.</p>}
                {testimonials.map((t) => (
                    <div key={t.id} className="rounded-xl border border-white/5 bg-ink-800 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-white">{t.user?.name}</span>
                                    <span className="text-gold">{'★'.repeat(t.rating)}<span className="text-white/20">{'★'.repeat(5 - t.rating)}</span></span>
                                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${t.approved ? 'bg-green-500/15 text-green-300' : 'bg-gold/15 text-gold'}`}>
                                        {t.approved ? 'Published' : 'Pending'}
                                    </span>
                                </div>
                                {t.role_title && <p className="text-xs text-gray-500">{t.role_title}</p>}
                                <p className="mt-2 text-sm text-gray-300">“{t.body}”</p>
                            </div>
                            <div className="flex flex-shrink-0 gap-3 text-sm">
                                {t.approved ? (
                                    <button onClick={() => setApproved(t, false)} className="text-gray-400 hover:text-white">Hide</button>
                                ) : (
                                    <button onClick={() => setApproved(t, true)} className="font-semibold text-green-400 hover:text-green-300">Approve</button>
                                )}
                                <button onClick={() => remove(t)} className="text-red-400 hover:text-red-300">Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export default function Manage({ profile, avatarUrl, d17QrUrl, testimonials, diplomas, experiences, internships, projects, skills, services }) {
    return (
        <PanelLayout title="Manage CV">
            <Head title="Manage CV" />

            <div className="space-y-8">
                <ProfileForm profile={profile} avatarUrl={avatarUrl} d17QrUrl={d17QrUrl} />

                <TestimonialsModerator testimonials={testimonials} />

                <ProjectsManager projects={projects} />

                <CollectionManager
                    title="Skills"
                    items={skills}
                    storeRoute="cv.skills.store"
                    updateRoute="cv.skills.update"
                    destroyRoute="cv.skills.destroy"
                    fields={[
                        { name: 'name', label: 'Skill', type: 'text' },
                        { name: 'level', label: 'Level (0–100)', type: 'number' },
                    ]}
                    summary={(s) => (
                        <>
                            <p className="font-semibold text-white">{s.name}</p>
                            <p className="text-xs text-gold">{s.level}%</p>
                        </>
                    )}
                />

                <CollectionManager
                    title="Services"
                    items={services}
                    storeRoute="cv.services.store"
                    updateRoute="cv.services.update"
                    destroyRoute="cv.services.destroy"
                    fields={[
                        { name: 'title', label: 'Service', type: 'text' },
                        { name: 'price', label: 'Starting price ($)', type: 'number' },
                        { name: 'description', label: 'Description', type: 'textarea' },
                    ]}
                    summary={(s) => (
                        <>
                            <p className="font-semibold text-white">{s.title}</p>
                            {s.price && <p className="text-xs text-gold">From ${s.price}</p>}
                            {s.description && <p className="mt-1 text-sm text-gray-400">{s.description}</p>}
                        </>
                    )}
                />

                <CollectionManager
                    title="Diplomas"
                    items={diplomas}
                    storeRoute="cv.diplomas.store"
                    updateRoute="cv.diplomas.update"
                    destroyRoute="cv.diplomas.destroy"
                    fields={[
                        { name: 'title', label: 'Title', type: 'text' },
                        { name: 'institution', label: 'Institution', type: 'text' },
                        { name: 'field', label: 'Field', type: 'text' },
                        { name: 'start_year', label: 'Start Year', type: 'number' },
                        { name: 'end_year', label: 'End Year', type: 'number' },
                        { name: 'description', label: 'Description', type: 'textarea' },
                    ]}
                    summary={(d) => (
                        <>
                            <p className="font-semibold text-white">{d.title}</p>
                            <p className="text-sm text-gold">{d.institution}</p>
                            <p className="text-xs text-gray-500">
                                {[d.field, [d.start_year, d.end_year].filter(Boolean).join(' — ')].filter(Boolean).join(' · ')}
                            </p>
                        </>
                    )}
                />

                <CollectionManager
                    title="Work Experience"
                    items={experiences}
                    storeRoute="cv.experiences.store"
                    updateRoute="cv.experiences.update"
                    destroyRoute="cv.experiences.destroy"
                    fields={[
                        { name: 'position', label: 'Position', type: 'text' },
                        { name: 'company', label: 'Company', type: 'text' },
                        { name: 'location', label: 'Location', type: 'text' },
                        { name: 'start_date', label: 'Start Date', type: 'date' },
                        { name: 'end_date', label: 'End Date', type: 'date' },
                        { name: 'is_current', label: 'I currently work here', type: 'checkbox' },
                        { name: 'description', label: 'Description', type: 'textarea' },
                    ]}
                    summary={(e) => (
                        <>
                            <p className="font-semibold text-white">{e.position}</p>
                            <p className="text-sm text-gold">{e.company}</p>
                            <p className="text-xs text-gray-500">
                                {[e.location, e.is_current ? 'Current' : null].filter(Boolean).join(' · ')}
                            </p>
                        </>
                    )}
                />

                <CollectionManager
                    title="Internships"
                    items={internships}
                    storeRoute="cv.internships.store"
                    updateRoute="cv.internships.update"
                    destroyRoute="cv.internships.destroy"
                    fields={[
                        { name: 'position', label: 'Position', type: 'text' },
                        { name: 'company', label: 'Company', type: 'text' },
                        { name: 'location', label: 'Location', type: 'text' },
                        { name: 'start_date', label: 'Start Date', type: 'date' },
                        { name: 'end_date', label: 'End Date', type: 'date' },
                        { name: 'description', label: 'Description', type: 'textarea' },
                    ]}
                    summary={(i) => (
                        <>
                            <p className="font-semibold text-white">{i.position}</p>
                            <p className="text-sm text-gold">{i.company}</p>
                            <p className="text-xs text-gray-500">{i.location}</p>
                        </>
                    )}
                />
            </div>
        </PanelLayout>
    );
}
