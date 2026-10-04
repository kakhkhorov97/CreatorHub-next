import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticationDestination, safeReturnTo, saveSession } from '../../auth';
import { useAction } from '../../hooks/useApi';
import { Button, Feedback, Field, Notice, Password, values } from '../common/UI';

export type AuthMode = 'sign-in' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';
const titles = {
	'sign-in': 'Welcome back',
	register: 'Create your account',
	'verify-email': 'Verify your email',
	'forgot-password': 'Forgot your password?',
	'reset-password': 'Choose a new password',
};

export function SocialButtons() {
	return (
		<div className="social-sign-in">
			<p className="divider-label">Or continue with</p>
			{['Google', 'Kakao', 'Telegram'].map((provider) => (
				<Button key={provider} secondary disabled>
					Continue with {provider}
				</Button>
			))}
			<small>Social sign-in is not available yet.</small>
		</div>
	);
}

export default function Auth({ mode }: { mode: AuthMode }) {
	const router = useRouter();
	const [method, setMethod] = useState('email');
	const action = useAction();
	const [message, setMessage] = useState('');
	const [showResend, setShowResend] = useState(false);
	const auth = mode === 'sign-in' || mode === 'register';
	const registering = mode === 'register';
	const returnTo = typeof router.query.returnTo === 'string' ? safeReturnTo(router.query.returnTo) : undefined;
	const authHref = (path: string) => (returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path);
	useEffect(() => {
		if (returnTo) sessionStorage.setItem('creatorhub.returnTo', returnTo);
	}, [returnTo]);

	async function submit(form: HTMLFormElement) {
		const f = values(form);
		setMessage('');
		await action.run(async () => {
			if (auth) {
				const payload = registering
					? method === 'email'
						? await action.mutate('register', {
								input: { email: f.email, password: f.password, displayName: f.displayName, preferredLocale: 'en' },
						  })
						: await action.mutate('registerPhone', {
								input: {
									phoneNumber: f.phoneNumber,
									password: f.password,
									displayName: f.displayName,
									preferredLocale: 'en',
								},
						  })
					: method === 'email'
					? await action.mutate('login', { input: { email: f.email, password: f.password } })
					: await action.mutate('loginPhone', { input: { phoneNumber: f.phoneNumber, password: f.password } });
				if (registering && method === 'email') {
					sessionStorage.setItem('creatorhub.pendingEmail', f.email);
					await router.push(returnTo || '/');
					return;
				}
				if (payload.accessToken) {
					saveSession(payload);
					await action.client.clearStore();
					await router.push(
						authenticationDestination(
							returnTo,
							sessionStorage.getItem('creatorhub.returnTo'),
							payload.user.role,
							registering,
						),
					);
					sessionStorage.removeItem('creatorhub.returnTo');
					sessionStorage.removeItem('creatorhub.pendingEmail');
				} else setMessage('Check your inbox to verify your email, then sign in.');
			} else if (mode === 'forgot-password') {
				await action.mutate('requestPasswordReset', { input: { email: f.email } });
				setMessage('If this email has an account, a password reset link will be sent.');
			} else if (mode === 'reset-password') {
				await action.mutate('resetPassword', { input: { token: f.token, password: f.password } });
				setMessage('Password changed. You can now sign in.');
			} else if (showResend) {
				await action.mutate('requestEmailVerification', { input: { email: f.email } });
				setMessage('If verification is needed, a new link will be sent.');
			} else {
				await action.mutate('verifyEmail', { token: f.token });
				setMessage('Your email is verified. You can now sign in.');
			}
		});
	}
	return (
		<>
			<Link passHref className="back-link" href="/">
				Back to explore
			</Link>
			<section className="auth-panel panel">
				<h1>{titles[mode]}</h1>
				{router.query.passwordChanged === '1' && <Notice notify>Password updated. Sign in again to continue.</Notice>}
				<p className="muted auth-intro">
					{auth
						? registering
							? 'Save creative work and start conversations with creators.'
							: 'Sign in to explore creators, save portfolios, and send project inquiries.'
						: mode === 'forgot-password'
						? 'Enter the email linked to your account.'
						: mode === 'verify-email'
						? 'Use the verification link sent to your inbox.'
						: 'Use 6–30 characters for your new password.'}
				</p>
				{auth && (
					<div className="tabs equal">
						{['email', 'phone'].map((m) => (
							<button type="button" key={m} className={method === m ? 'active' : ''} onClick={() => setMethod(m)}>
								{m === 'email' ? 'Email' : 'Phone'}
							</button>
						))}
					</div>
				)}
				<form
					key={`${mode}-${method}-${showResend}`}
					onSubmit={(e) => {
						e.preventDefault();
						submit(e.currentTarget);
					}}
				>
					{registering && (
						<Field label="Display name" name="displayName" autoComplete="name" required minLength={2} maxLength={60} />
					)}
					{((auth && method === 'email') || mode === 'forgot-password' || showResend) && (
						<Field label="Email" name="email" type="email" autoComplete="email" required maxLength={254} />
					)}{' '}
					{auth && method === 'phone' && (
						<Field
							label="Phone number"
							name="phoneNumber"
							type="tel"
							autoComplete="tel"
							required
							pattern="\+[1-9][0-9]{7,14}"
							placeholder="+821012345678"
							hint="Include your country code. Phone registration does not verify ownership of the number."
						/>
					)}
					{(mode === 'reset-password' || (mode === 'verify-email' && !showResend)) && (
						<Field
							label="Verification token"
							name="token"
							required
							minLength={64}
							maxLength={64}
							defaultValue={typeof router.query.token === 'string' ? router.query.token : ''}
						/>
					)}
					{(auth || mode === 'reset-password') && (
						<Password
							name="password"
							required
							minLength={6}
							maxLength={30}
							autoComplete={registering || mode === 'reset-password' ? 'new-password' : 'current-password'}
						/>
					)}{' '}
					{registering && <small>Use 6–30 characters for your password.</small>}
					{mode === 'sign-in' && (
						<Link passHref className="forgot" href={authHref('/account/forgot-password')}>
							Forgot password?
						</Link>
					)}
					<Feedback {...action} />
					{message && <Notice notify>{message}</Notice>}
					<Button type="submit" disabled={action.busy}>
						{action.busy
							? 'Please wait…'
							: mode === 'sign-in'
							? 'Sign in'
							: registering
							? 'Create account'
							: mode === 'forgot-password'
							? 'Send reset link'
							: mode === 'reset-password'
							? 'Reset password'
							: showResend
							? 'Resend verification email'
							: 'Verify email'}
					</Button>
				</form>
				{auth && <SocialButtons />}
				{mode === 'verify-email' && (
					<div className="verification-resend">
						<p>Need another verification email?</p>
						<Button secondary className="resend-button" onClick={() => setShowResend(!showResend)}>
							{showResend ? 'Use a verification token' : 'Resend email'}
						</Button>
					</div>
				)}
				<p className="auth-bottom">
					{mode === 'sign-in' ? (
						<>
							Don’t have an account?{' '}
							<Link passHref href={authHref('/account/register')}>
								Create an account
							</Link>
							<br />
							<Link passHref href={authHref('/account/verify-email')}>
								Verify your email
							</Link>
						</>
					) : (
						<Link passHref href={authHref('/account/sign-in')}>
							Back to sign in
						</Link>
					)}
				</p>
			</section>
		</>
	);
}
