import AuthLayout, { AuthButton, AuthInput, Icons } from '@/Layouts/AuthLayout';
import { Link, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout
            title="Forgot Password"
            heading="Forgot your password?"
            intro="No problem. Tell us the email you signed up with and we'll send you a link to choose a new one."
            formTitle="Reset Password"
        >
            {status && (
                <div className="mb-5 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-600">
                    {status}
                </div>
            )}

            <p className="mb-5 text-center text-sm text-gray-500">
                Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={submit} className="space-y-5">
                <AuthInput
                    icon={Icons.mail}
                    error={errors.email}
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    autoFocus
                    placeholder="Email"
                    onChange={(e) => setData('email', e.target.value)}
                />

                <AuthButton type="submit" disabled={processing}>
                    {processing ? 'Sending…' : 'Send reset link'}
                </AuthButton>

                <p className="pt-2 text-center text-sm text-gray-500">
                    Remembered it?{' '}
                    <Link href={route('login')} className="font-semibold text-violet-600 hover:text-violet-800">
                        Back to login
                    </Link>
                </p>
            </form>
        </AuthLayout>
    );
}
