import Photo from '@/Components/Photo';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

const PHOTO = ['/images/taha.png', '/images/taha.jpg'];

const NAV = [
    { label: 'Home', href: '#home' },
    { label: 'About', href: '#about' },
    { label: 'Skills', href: '#skills' },
    { label: 'Services', href: '#services' },
    { label: 'Projects', href: '#projects' },
    { label: 'Resume', href: '#resume' },
    { label: 'Post a Task', href: '#tasks' },
    { label: 'Contact', href: '#contact' },
];

// Photo sources: uploaded avatar first, then static files, then initials fallback.
function photoSources(freelancer) {
    return [freelancer?.avatar_url, '/images/taha.png', '/images/taha.jpg'].filter(Boolean);
}

function fmtDate(value) {
    if (!value) return null;
    const d = new Date(value);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function range(start, end, current) {
    const from = fmtDate(start) ?? (typeof start === 'number' ? start : null);
    const to = current ? 'Present' : (fmtDate(end) ?? (typeof end === 'number' ? end : null));
    if (!from && !to) return '';
    return [from, to].filter(Boolean).join(' — ');
}

function Navbar({ user }) {
    const [open, setOpen] = useState(false);

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink/80 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <a href="#home" className="text-xl font-black tracking-widest text-white">
                    TAHA<span className="text-gold">.</span>
                </a>

                <div className="hidden items-center gap-7 md:flex">
                    {NAV.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-gray-300 transition hover:text-gold"
                        >
                            {item.label}
                        </a>
                    ))}
                    {user ? (
                        <Link
                            href={route('dashboard')}
                            className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-300"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link href={route('login')} className="text-sm font-medium text-gray-300 hover:text-gold">
                                Login
                            </Link>
                            <Link
                                href={route('register')}
                                className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gold-300"
                            >
                                Sign up
                            </Link>
                        </div>
                    )}
                </div>

                <button
                    onClick={() => setOpen((o) => !o)}
                    className="text-gray-200 md:hidden"
                    aria-label="Toggle menu"
                >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </nav>

            {open && (
                <div className="border-t border-white/5 bg-ink px-6 pb-4 md:hidden">
                    {NAV.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className="block py-2 text-sm text-gray-300 hover:text-gold"
                        >
                            {item.label}
                        </a>
                    ))}
                    <div className="mt-2 flex gap-3">
                        {user ? (
                            <Link href={route('dashboard')} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="rounded-full border border-white/20 px-4 py-2 text-sm text-white">
                                    Login
                                </Link>
                                <Link href={route('register')} className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

function SectionTitle({ children, ghost }) {
    return (
        <div className="relative mb-10">
            <h2 className="relative z-10 text-3xl font-extrabold text-white sm:text-4xl">{children}</h2>
            {ghost && (
                <span className="pointer-events-none absolute -bottom-4 left-0 select-none text-5xl font-black text-white/5 sm:text-6xl">
                    {ghost}
                </span>
            )}
            <div className="mt-4 h-1 w-14 rounded bg-gold" />
        </div>
    );
}

function Hero({ freelancer, user }) {
    return (
        <section id="home" className="relative overflow-hidden pt-28">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-24">
                <div>
                    <p className="mb-3 text-sm font-bold uppercase tracking-[0.3em] text-gold">Hello!</p>
                    <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                        I'm <span className="text-gold">Taha Yassine</span>
                        <br />
                        Youssef
                    </h1>
                    <p className="mt-5 text-lg text-gray-300">
                        {freelancer?.headline ?? 'Freelance Full-Stack Developer'}
                    </p>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <a
                            href="#tasks"
                            className="rounded-full bg-gold px-7 py-3 text-sm font-bold uppercase tracking-wide text-ink shadow-lg shadow-gold/20 transition hover:bg-gold-300"
                        >
                            Hire Me
                        </a>
                        <a
                            href="#projects"
                            className="rounded-full border border-white/20 px-7 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-gold hover:text-gold"
                        >
                            My Works
                        </a>
                    </div>
                </div>

                <div className="relative mx-auto w-full max-w-md">
                    {/* Soft glow */}
                    <div className="absolute -inset-6 z-0 rounded-full bg-gold/25 blur-3xl" />
                    {/* Solid gold backdrop that shows behind the transparent PNG */}
                    <div className="absolute inset-0 z-0 rounded-[2.5rem] bg-gradient-to-b from-gold to-gold-600" />
                    <Photo
                        src={photoSources(freelancer)}
                        name="Taha Yassine Youssef"
                        rounded="rounded-[2.5rem]"
                        className="relative z-10 aspect-[4/5] w-full"
                    />
                </div>
            </div>
        </section>
    );
}

function About({ freelancer, user }) {
    return (
        <section id="about" className="border-t border-white/5 py-20">
            <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[280px_1fr] md:items-start">
                <Photo
                    src={photoSources(freelancer)}
                    name="Taha Yassine Youssef"
                    rounded="rounded-2xl"
                    className="aspect-square w-full max-w-[280px] shadow-xl"
                />
                <div>
                    <SectionTitle ghost="About">About Me</SectionTitle>
                    <p className="max-w-2xl text-gray-300">{freelancer?.bio}</p>

                    <dl className="mt-8 grid max-w-xl grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                        <Detail label="Name" value={freelancer?.name} />
                        <Detail label="Email" value={freelancer?.email} />
                        <Detail label="Location" value={freelancer?.location} />
                        <Detail label="Phone" value={freelancer?.phone} />
                    </dl>

                    <div className="mt-8 flex flex-wrap gap-4">
                        <a href="#contact" className="rounded-full bg-gold px-6 py-3 text-sm font-bold uppercase text-ink transition hover:bg-gold-300">
                            Chat with me
                        </a>
                        <a href="#resume" className="rounded-full border border-white/20 px-6 py-3 text-sm font-bold uppercase text-white transition hover:border-gold hover:text-gold">
                            My Resume
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}

function Detail({ label, value }) {
    if (!value) return null;
    return (
        <div className="flex gap-2 border-b border-white/5 py-2">
            <dt className="font-semibold text-white">{label}:</dt>
            <dd className="text-gray-400">{value}</dd>
        </div>
    );
}

function Card({ title, subtitle, meta, children }) {
    return (
        <div className="rounded-2xl border border-white/5 bg-ink-700 p-6 transition hover:border-gold/40">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <p className="mt-0.5 font-medium text-gold">{subtitle}</p>
                </div>
                {meta && (
                    <span className="whitespace-nowrap rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-gray-300">
                        {meta}
                    </span>
                )}
            </div>
            {children && <p className="mt-3 text-sm text-gray-400">{children}</p>}
        </div>
    );
}

function Resume({ diplomas }) {
    return (
        <section id="resume" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Diplomas">Education &amp; Diplomas</SectionTitle>
                <div className="grid gap-5 md:grid-cols-2">
                    {diplomas?.length ? (
                        diplomas.map((d) => (
                            <Card
                                key={d.id}
                                title={d.title}
                                subtitle={d.institution}
                                meta={range(d.start_year, d.end_year)}
                            >
                                {d.field ? `${d.field}. ` : ''}
                                {d.description}
                            </Card>
                        ))
                    ) : (
                        <p className="text-gray-500">No diplomas added yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function Experience({ experiences }) {
    return (
        <section id="experience" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Work">Work Experience</SectionTitle>
                <div className="grid gap-5 md:grid-cols-2">
                    {experiences?.length ? (
                        experiences.map((e) => (
                            <Card
                                key={e.id}
                                title={e.position}
                                subtitle={e.company}
                                meta={range(e.start_date, e.end_date, e.is_current)}
                            >
                                {e.location ? `${e.location}. ` : ''}
                                {e.description}
                            </Card>
                        ))
                    ) : (
                        <p className="text-gray-500">No experience added yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function Internships({ internships }) {
    return (
        <section id="internships" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Intern">Internships</SectionTitle>
                <div className="grid gap-5 md:grid-cols-2">
                    {internships?.length ? (
                        internships.map((i) => (
                            <Card
                                key={i.id}
                                title={i.position}
                                subtitle={i.company}
                                meta={range(i.start_date, i.end_date)}
                            >
                                {i.location ? `${i.location}. ` : ''}
                                {i.description}
                            </Card>
                        ))
                    ) : (
                        <p className="text-gray-500">No internships added yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function Skills({ skills }) {
    if (!skills?.length) return null;
    return (
        <section id="skills" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Skills">My Skills</SectionTitle>
                <div className="grid gap-x-10 gap-y-6 md:grid-cols-2">
                    {skills.map((s) => (
                        <div key={s.id}>
                            <div className="mb-1 flex justify-between text-sm">
                                <span className="font-medium text-white">{s.name}</span>
                                <span className="text-gold">{s.level}%</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-600" style={{ width: `${s.level}%` }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function Services({ services }) {
    if (!services?.length) return null;
    return (
        <section id="services" className="border-t border-white/5 bg-ink-800 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Services">What I Do</SectionTitle>
                <div className="grid gap-5 md:grid-cols-3">
                    {services.map((s) => (
                        <div key={s.id} className="rounded-2xl border border-white/5 bg-ink-700 p-6 transition hover:border-gold/40">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gold/15 text-2xl">
                                {s.icon || '⚡'}
                            </div>
                            <h3 className="text-lg font-bold text-white">{s.title}</h3>
                            {s.description && <p className="mt-2 text-sm text-gray-400">{s.description}</p>}
                            {s.price && <p className="mt-4 font-semibold text-gold">From ${s.price}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// Extracts a YouTube video ID from common URL formats and returns its thumbnail.
function youtubeThumbnail(url) {
    if (!url) return null;
    const m = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
    );
    return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}

function Projects({ projects }) {
    return (
        <section id="projects" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-6xl px-6">
                <SectionTitle ghost="Works">My Projects</SectionTitle>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects?.length ? (
                        projects.map((p) => (
                            <div key={p.id} className="group overflow-hidden rounded-2xl border border-white/5 bg-ink-700 transition hover:border-gold/40">
                                <div className="relative aspect-video w-full overflow-hidden bg-ink">
                                    {p.video_url ? (
                                        <video src={p.video_url} controls poster={p.image_url ?? undefined} className="h-full w-full object-cover" />
                                    ) : p.image_url ? (
                                        <img src={p.image_url} alt={p.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                    ) : youtubeThumbnail(p.live_url) ? (
                                        <a href={p.live_url} target="_blank" rel="noreferrer" className="group/yt block h-full w-full">
                                            <img src={youtubeThumbnail(p.live_url)} alt={p.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                                            <span className="absolute inset-0 flex items-center justify-center">
                                                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white ring-2 ring-white/70 transition group-hover/yt:bg-red-600">
                                                    <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                                </span>
                                            </span>
                                        </a>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-4xl text-white/10">{'</>'}</div>
                                    )}
                                </div>
                                <div className="p-5">
                                    <h3 className="text-lg font-bold text-white">{p.title}</h3>
                                    {p.tech_stack && <p className="mt-1 text-xs font-medium text-gold">{p.tech_stack}</p>}
                                    {p.description && <p className="mt-2 line-clamp-3 text-sm text-gray-400">{p.description}</p>}
                                    <div className="mt-4 flex gap-4 text-sm">
                                        {p.live_url && (
                                            <a href={p.live_url} target="_blank" rel="noreferrer" className="font-semibold text-gold hover:text-gold-300">
                                                Live ↗
                                            </a>
                                        )}
                                        {p.github_url && (
                                            <a href={p.github_url} target="_blank" rel="noreferrer" className="font-semibold text-gray-300 hover:text-white">
                                                GitHub ↗
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No projects added yet.</p>
                    )}
                </div>
            </div>
        </section>
    );
}

function TaskSection({ user }) {
    const { data, setData, post, processing, errors, reset, wasSuccessful } = useForm({
        title: '',
        description: '',
        category: '',
        budget: '',
        deadline: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('tasks.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const isClient = user && user.role === 'client';

    return (
        <section id="tasks" className="border-t border-white/5 bg-ink-800 py-20">
            <div className="mx-auto max-w-3xl px-6">
                <SectionTitle ghost="Hire">Post a Task</SectionTitle>
                <p className="mb-8 max-w-xl text-gray-300">
                    Have a project in mind? Post the details below and Taha will get back to you.
                </p>

                {!user && (
                    <div className="rounded-2xl border border-gold/30 bg-gold/5 p-6 text-gray-200">
                        Please{' '}
                        <Link href={route('login')} className="font-semibold text-gold underline">
                            log in
                        </Link>{' '}
                        or{' '}
                        <Link href={route('register')} className="font-semibold text-gold underline">
                            create an account
                        </Link>{' '}
                        to post a task and chat with Taha.
                    </div>
                )}

                {user && !isClient && (
                    <div className="rounded-2xl border border-white/10 bg-ink-700 p-6 text-gray-300">
                        You are signed in as the freelancer. View incoming tasks in your{' '}
                        <Link href={route('dashboard')} className="font-semibold text-gold underline">
                            dashboard
                        </Link>
                        .
                    </div>
                )}

                {isClient && (
                    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-white/5 bg-ink-700 p-6">
                        {wasSuccessful && (
                            <p className="rounded-lg bg-green-500/10 px-4 py-2 text-sm text-green-400">
                                Your task has been posted successfully!
                            </p>
                        )}
                        <Field label="Title" error={errors.title}>
                            <input
                                type="text"
                                value={data.title}
                                onChange={(e) => setData('title', e.target.value)}
                                className={inputCls}
                                placeholder="e.g. Build a company landing page"
                            />
                        </Field>
                        <Field label="Description" error={errors.description}>
                            <textarea
                                rows={4}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                className={inputCls}
                                placeholder="Describe what you need…"
                            />
                        </Field>
                        <div className="grid gap-5 sm:grid-cols-3">
                            <Field label="Category" error={errors.category}>
                                <input
                                    type="text"
                                    value={data.category}
                                    onChange={(e) => setData('category', e.target.value)}
                                    className={inputCls}
                                    placeholder="Web Dev"
                                />
                            </Field>
                            <Field label="Budget ($)" error={errors.budget}>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={data.budget}
                                    onChange={(e) => setData('budget', e.target.value)}
                                    className={inputCls}
                                    placeholder="500"
                                />
                            </Field>
                            <Field label="Deadline" error={errors.deadline}>
                                <input
                                    type="date"
                                    value={data.deadline}
                                    onChange={(e) => setData('deadline', e.target.value)}
                                    className={inputCls}
                                />
                            </Field>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-gold-300 disabled:opacity-60"
                        >
                            {processing ? 'Posting…' : 'Post Task'}
                        </button>
                    </form>
                )}
            </div>
        </section>
    );
}

const inputCls =
    'w-full rounded-lg border border-white/10 bg-ink px-4 py-2.5 text-white placeholder-gray-500 focus:border-gold focus:ring-gold';

function Field({ label, error, children }) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-300">{label}</span>
            {children}
            {error && <span className="mt-1 block text-sm text-red-400">{error}</span>}
        </label>
    );
}

function Contact({ user, freelancer }) {
    return (
        <section id="contact" className="border-t border-white/5 py-20">
            <div className="mx-auto max-w-3xl px-6 text-center">
                <SectionTitle ghost="Talk">
                    <span className="block text-center">Let's Talk</span>
                </SectionTitle>
                <p className="mx-auto mb-8 max-w-xl text-gray-300">
                    Connect with Taha directly through live chat to discuss your project.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                    {user ? (
                        <Link
                            href={route('chat.index')}
                            className="rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-gold-300"
                        >
                            Open Chat
                        </Link>
                    ) : (
                        <Link
                            href={route('login')}
                            className="rounded-full bg-gold px-8 py-3 text-sm font-bold uppercase tracking-wide text-ink transition hover:bg-gold-300"
                        >
                            Log in to Chat
                        </Link>
                    )}
                    {freelancer?.email && (
                        <a
                            href={`mailto:${freelancer.email}`}
                            className="rounded-full border border-white/20 px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:border-gold hover:text-gold"
                        >
                            Email Me
                        </a>
                    )}
                </div>
            </div>
        </section>
    );
}

export default function Home({ freelancer }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const [toast, setToast] = useState(flash?.success);

    useEffect(() => {
        setToast(flash?.success);
        if (flash?.success) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [flash?.success]);

    return (
        <div className="min-h-screen bg-ink text-white">
            <Head title="Taha Yassine Youssef — Freelance Developer" />
            <Navbar user={user} />

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-green-500 px-5 py-3 text-sm font-medium text-white shadow-lg">
                    {toast}
                </div>
            )}

            <main>
                <Hero freelancer={freelancer} user={user} />
                <About freelancer={freelancer} user={user} />
                <Skills skills={freelancer?.skills} />
                <Services services={freelancer?.services} />
                <Projects projects={freelancer?.projects} />
                <Resume diplomas={freelancer?.diplomas} />
                <Experience experiences={freelancer?.experiences} />
                <Internships internships={freelancer?.internships} />
                <TaskSection user={user} />
                <Contact user={user} freelancer={freelancer} />
            </main>

            <footer className="border-t border-white/5 py-8 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Taha Yassine Youssef. All rights reserved.
            </footer>
        </div>
    );
}
