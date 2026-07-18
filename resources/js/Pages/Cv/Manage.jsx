import CollectionManager from '@/Components/CollectionManager';
import ProjectsManager from '@/Components/ProjectsManager';
import PanelLayout from '@/Layouts/PanelLayout';
import Photo from '@/Components/Photo';
import { useT } from '@/i18n';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const inputCls =
    'w-full rounded-lg border border-white/10 bg-ink px-4 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:ring-gold';

function ProfileForm({ profile, avatarUrl, d17QrUrl }) {
    const t = useT();
    const [data, setData] = useState({
        name: profile.name ?? '',
        headline: profile.headline ?? '',
        headline_fr: profile.headline_fr ?? '',
        headline_ar: profile.headline_ar ?? '',
        bio: profile.bio ?? '',
        bio_fr: profile.bio_fr ?? '',
        bio_ar: profile.bio_ar ?? '',
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
                <h2 className="text-lg font-bold text-white">{t('Profile')}</h2>
                {saved && <span className="text-sm text-green-400">{t('Saved!')}</span>}
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
                        <span className="mb-1 block text-xs font-medium text-gray-400">{t('Profile photo')}</span>
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
                        <span className="mb-1 block text-xs font-medium text-gray-400">{t('Name')}</span>
                        <input value={data.name} onChange={(e) => set('name', e.target.value)} className={inputCls} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">{t('Headline')} 🇬🇧</span>
                        <input value={data.headline} onChange={(e) => set('headline', e.target.value)} className={inputCls} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">{t('Headline')} 🇫🇷</span>
                        <input value={data.headline_fr} onChange={(e) => set('headline_fr', e.target.value)} className={inputCls} placeholder={t('Leave empty to use English')} />
                    </label>
                    <label className="block" dir="rtl">
                        <span className="mb-1 block text-xs font-medium text-gray-400">{t('Headline')} 🇹🇳</span>
                        <input value={data.headline_ar} onChange={(e) => set('headline_ar', e.target.value)} className={inputCls} placeholder={t('Leave empty to use English')} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">{t('Location')}</span>
                        <input value={data.location} onChange={(e) => set('location', e.target.value)} className={inputCls} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">{t('Phone')}</span>
                        <input value={data.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} />
                    </label>
                    <label className="block">
                        <span className="mb-1 block text-xs font-medium text-gray-400">{t('D17 wallet number')}</span>
                        <input value={data.d17_number} onChange={(e) => set('d17_number', e.target.value)} className={inputCls} placeholder={t('e.g. 27617930')} />
                    </label>
                </div>

                <div className="flex items-center gap-5 rounded-xl border border-white/10 bg-ink-800 p-4">
                    {(d17Preview ?? d17QrUrl) ? (
                        <img src={d17Preview ?? d17QrUrl} alt="D17 QR" className="h-20 w-20 rounded-lg bg-white p-1" />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-white/20 text-xs text-gray-500">
                            {t('No QR')}
                        </div>
                    )}
                    <label className="cursor-pointer">
                        <span className="mb-1 block text-xs font-medium text-gray-400">{t('D17 QR code (optional)')}</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => pickD17Qr(e.target.files[0] ?? null)}
                            className="block text-sm text-gray-400 file:mr-3 file:rounded-full file:border-0 file:bg-[#31a9e0] file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:opacity-90"
                        />
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-400">{t('Bio')} 🇬🇧</span>
                    <textarea rows={4} value={data.bio} onChange={(e) => set('bio', e.target.value)} className={inputCls} />
                </label>
                <label className="block">
                    <span className="mb-1 block text-xs font-medium text-gray-400">{t('Bio')} 🇫🇷</span>
                    <textarea rows={4} value={data.bio_fr} onChange={(e) => set('bio_fr', e.target.value)} className={inputCls} placeholder={t('Leave empty to use English')} />
                </label>
                <label className="block" dir="rtl">
                    <span className="mb-1 block text-xs font-medium text-gray-400">{t('Bio')} 🇹🇳</span>
                    <textarea rows={4} value={data.bio_ar} onChange={(e) => set('bio_ar', e.target.value)} className={inputCls} placeholder={t('Leave empty to use English')} />
                </label>
                <button
                    type="submit"
                    disabled={processing}
                    className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-ink hover:bg-gold-300 disabled:opacity-60"
                >
                    {t('Save Profile')}
                </button>
            </form>
        </section>
    );
}

export default function Manage({ profile, avatarUrl, d17QrUrl, testimonials, diplomas, experiences, internships, projects, skills, services }) {
    const t = useT();
    return (
        <PanelLayout title="Manage CV">
            <Head title="Manage CV" />

            <div className="space-y-8">
                <ProfileForm profile={profile} avatarUrl={avatarUrl} d17QrUrl={d17QrUrl} />

                <ProjectsManager projects={projects} />

                <CollectionManager
                    title={t('Skills')}
                    items={skills}
                    storeRoute="cv.skills.store"
                    updateRoute="cv.skills.update"
                    destroyRoute="cv.skills.destroy"
                    fields={[
                        { name: 'name', label: t('Skill'), type: 'text' },
                        { name: 'level', label: t('Level (0–100)'), type: 'number' },
                    ]}
                    summary={(s) => (
                        <>
                            <p className="font-semibold text-white">{s.name}</p>
                            <p className="text-xs text-gold">{s.level}%</p>
                        </>
                    )}
                />

                <CollectionManager
                    title={t('Services')}
                    items={services}
                    storeRoute="cv.services.store"
                    updateRoute="cv.services.update"
                    destroyRoute="cv.services.destroy"
                    fields={[
                        { name: 'title', label: t('Service'), type: 'text' },
                        { name: 'price', label: t('Starting price ($)'), type: 'number' },
                        { name: 'description', label: t('Description'), type: 'textarea' },
                    ]}
                    summary={(s) => (
                        <>
                            <p className="font-semibold text-white">{s.title}</p>
                            {s.price && <p className="text-xs text-gold">{t('From')} ${s.price}</p>}
                            {s.description && <p className="mt-1 text-sm text-gray-400">{s.description}</p>}
                        </>
                    )}
                />

                <CollectionManager
                    title={t('Diplomas')}
                    items={diplomas}
                    storeRoute="cv.diplomas.store"
                    updateRoute="cv.diplomas.update"
                    destroyRoute="cv.diplomas.destroy"
                    fields={[
                        { name: 'title', label: t('Title'), type: 'text' },
                        { name: 'institution', label: t('Institution'), type: 'text' },
                        { name: 'field', label: t('Field'), type: 'text' },
                        { name: 'start_year', label: t('Start Year'), type: 'number' },
                        { name: 'end_year', label: t('End Year'), type: 'number' },
                        { name: 'description', label: t('Description'), type: 'textarea' },
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
                    title={t('Work Experience')}
                    items={experiences}
                    storeRoute="cv.experiences.store"
                    updateRoute="cv.experiences.update"
                    destroyRoute="cv.experiences.destroy"
                    fields={[
                        { name: 'position', label: t('Position'), type: 'text' },
                        { name: 'company', label: t('Company'), type: 'text' },
                        { name: 'location', label: t('Location'), type: 'text' },
                        { name: 'start_date', label: t('Start Date'), type: 'date' },
                        { name: 'end_date', label: t('End Date'), type: 'date' },
                        { name: 'is_current', label: t('I currently work here'), type: 'checkbox' },
                        { name: 'description', label: t('Description'), type: 'textarea' },
                    ]}
                    summary={(e) => (
                        <>
                            <p className="font-semibold text-white">{e.position}</p>
                            <p className="text-sm text-gold">{e.company}</p>
                            <p className="text-xs text-gray-500">
                                {[e.location, e.is_current ? t('Current') : null].filter(Boolean).join(' · ')}
                            </p>
                        </>
                    )}
                />

                <CollectionManager
                    title={t('Internships')}
                    items={internships}
                    storeRoute="cv.internships.store"
                    updateRoute="cv.internships.update"
                    destroyRoute="cv.internships.destroy"
                    fields={[
                        { name: 'position', label: t('Position'), type: 'text' },
                        { name: 'company', label: t('Company'), type: 'text' },
                        { name: 'location', label: t('Location'), type: 'text' },
                        { name: 'start_date', label: t('Start Date'), type: 'date' },
                        { name: 'end_date', label: t('End Date'), type: 'date' },
                        { name: 'description', label: t('Description'), type: 'textarea' },
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
