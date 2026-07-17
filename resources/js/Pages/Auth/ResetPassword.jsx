import AuthLayout, { AuthButton, AuthInput, Icons } from '@/Layouts/AuthLayout';
import { useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout
            title="Reset Password"
            heading="Choose a new password"
            intro="Almost there. Pick a new password for your account and you'll be logged straight back in."
            formTitle="New Password"
        >
            <form onSubmit={submit} className="space-y-4">
                <AuthInput
                    icon={Icons.mail}
                    error={errors.email}
                    id="email"
                    type="email"
                    name="email"
                    value={data.email}
                    autoComplete="username"
                    placeholder="Email"
                    onChange={(e) => setData('email', e.target.value)}
                />

                <AuthInput
                    icon={Icons.lock}
                    error={errors.password}
                    id="password"
                    type="password"
                    name="password"
                    value={data.password}
                    autoComplete="new-password"
                    autoFocus
                    placeholder="New password"
                    onChange={(e) => setData('password', e.target.value)}
                />

                <AuthInput
                    icon={Icons.lock}
                    error={errors.password_confirmation}
                    id="password_confirmation"
                    type="password"
                    name="password_confirmation"
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                />

                <AuthButton type="submit" disabled={processing}>
                    {processing ? 'Saving…' : 'Reset password'}
                </AuthButton>
            </form>
        </AuthLayout>
    );
}
