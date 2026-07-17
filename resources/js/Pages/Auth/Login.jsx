import InputError from '@/Components/InputError';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { googleEnabled } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-4">
            <Head title="Log in" />

            <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                {/* Left decorative panel */}
                <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-12 md:flex md:flex-col md:justify-center">
                    {/* Comet / meteor shapes */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="absolute -bottom-10 left-4 h-8 w-72 -rotate-45 rounded-full bg-gradient-to-r from-orange-500 to-amber-300 opacity-90 blur-[1px]" />
                        <div className="absolute bottom-6 left-0 h-5 w-56 -rotate-45 rounded-full bg-gradient-to-r from-orange-400 to-yellow-300 opacity-80" />
                        <div className="absolute bottom-24 left-10 h-3 w-40 -rotate-45 rounded-full bg-gradient-to-r from-pink-400 to-amber-200 opacity-70 blur-[1px]" />
                        <div className="absolute -bottom-4 left-32 h-10 w-96 -rotate-45 rounded-full bg-gradient-to-r from-rose-500 to-orange-300 opacity-60 blur-sm" />
                        <div className="absolute right-0 top-0 h-64 w-64 translate-x-1/3 -translate-y-1/3 rounded-full bg-white/10 blur-2xl" />
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-4xl font-black leading-tight text-white lg:text-5xl">
                            Welcome back
                        </h1>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-indigo-100">
                            Log in to connect with Taha Yassine Youssef — post your tasks, chat directly,
                            and manage your projects in one place.
                        </p>
                        <Link
                            href={route('home')}
                            className="mt-8 inline-block text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
                        >
                            ← Back to home
                        </Link>
                    </div>
                </div>

                {/* Right form panel */}
                <div className="w-full p-8 sm:p-12 md:w-1/2">
                    <h2 className="mb-6 text-center text-xl font-bold uppercase tracking-[0.2em] text-violet-600">
                        User Login
                    </h2>

                    {/* Google sign-in — only rendered once OAuth credentials are configured */}
                    {googleEnabled && (
                        <>
                            <a
                                href={route('google.redirect')}
                                className="flex w-full items-center justify-center gap-3 rounded-full border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                                    <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.15 6.16-4.15z" />
                                </svg>
                                Continue with Google
                            </a>

                            <div className="my-5 flex items-center gap-3">
                                <span className="h-px flex-1 bg-gray-200" />
                                <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
                                <span className="h-px flex-1 bg-gray-200" />
                            </div>
                        </>
                    )}

                    {status && (
                        <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm font-medium text-green-600">
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email */}
                        <div>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-violet-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    autoComplete="username"
                                    autoFocus
                                    placeholder="Email"
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-full border-0 bg-indigo-50 py-3 pl-12 pr-4 text-sm text-gray-700 placeholder-violet-400 focus:bg-indigo-50 focus:ring-2 focus:ring-violet-400"
                                />
                            </div>
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="relative">
                                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-violet-400">
                                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full rounded-full border-0 bg-indigo-50 py-3 pl-12 pr-4 text-sm text-gray-700 placeholder-violet-400 focus:bg-indigo-50 focus:ring-2 focus:ring-violet-400"
                                />
                            </div>
                            <InputError message={errors.password} className="mt-2" />
                        </div>

                        {/* Remember + forgot */}
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-500">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-gray-300 text-violet-500 focus:ring-violet-400"
                                />
                                Remember
                            </label>
                            {canResetPassword && (
                                <Link href={route('password.request')} className="text-violet-500 hover:text-violet-700">
                                    Forgot password?
                                </Link>
                            )}
                        </div>

                        {/* Submit */}
                        <div className="pt-2 text-center">
                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-12 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-violet-500/30 transition hover:opacity-90 disabled:opacity-60"
                            >
                                {processing ? 'Logging in…' : 'Login'}
                            </button>
                        </div>

                        <p className="pt-2 text-center text-sm text-gray-500">
                            Don't have an account?{' '}
                            <Link href={route('register')} className="font-semibold text-violet-600 hover:text-violet-800">
                                Sign up
                            </Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
