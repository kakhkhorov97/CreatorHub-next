import { useTranslation as useSiteTranslation } from 'next-i18next';
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
	const { t: translate } = useSiteTranslation('common');

	return (
		<div className="social-sign-in">
			<p className="divider-label">{translate('Or continue with')}</p>
			{['Google', 'Kakao', 'Telegram'].map((provider) => (
				<Button key={provider} secondary disabled>
					{translate('Continue with')} {provider}
				</Button>
			))}
			<small>{translate('Social sign-in is not available yet.')}</small>
		</div>
	);
}

export default function Auth({ mode }: { mode: AuthMode }) {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const [countryCode, setCountryCode] = useState('+82');
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
		if (registering) {
			f.phoneNumber = f.phoneNumber.trim().startsWith('+')
				? f.phoneNumber.trim()
				: countryCode +
				  f.phoneNumber
						.trim()
						.replace(/[\s()-]/g, '')
						.replace(/^0/, '');
		}

		setMessage('');
		if (registering && f.password !== f.confirmPassword) {
			action.setError(translate('Passwords do not match. Please try again.'));
			return;
		}
		await action.run(async () => {
			if (auth) {
				const payload = registering
					? await action.mutate('register', {
							input: {
								email: f.email.trim(),
								phoneNumber: f.phoneNumber,
								password: f.password,
								displayName: f.displayName,
								preferredLocale: router.locale === 'ko' ? 'ko' : router.locale === 'uz' ? 'uz' : 'en',
							},
					  })
					: await action.mutate('login', { input: { email: f.email.trim(), password: f.password } });
				if (registering) {
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
				{translate('Back to explore')}
			</Link>
			<section className="auth-panel panel">
				<h1>{translate(titles[mode])}</h1>
				{router.query.passwordChanged === '1' && (
					<Notice notify>{translate('Password updated. Sign in again to continue.')}</Notice>
				)}
				<p className="muted auth-intro">
					{auth
						? registering
							? translate('Save creative work and start conversations with creators.')
							: translate('Sign in to explore creators, save portfolios, and send project inquiries.')
						: mode === 'forgot-password'
						? translate('Enter the email linked to your account.')
						: mode === 'verify-email'
						? translate('Use the verification link sent to your inbox.')
						: translate('Choose a password you do not use for another account.')}
				</p>

				<form
					key={`${mode}-${showResend}`}
					onSubmit={(e) => {
						e.preventDefault();
						submit(e.currentTarget);
					}}
				>
					{mode === 'sign-in' && (
						<Field label={translate('Email')} name="email" type="email" autoComplete="email" required maxLength={254} />
					)}
					{registering && (
						<Field
							label={translate('Your name')}
							name="displayName"
							autoComplete="name"
							required
							minLength={3}
							maxLength={40}
						/>
					)}
					{(mode === 'forgot-password' || showResend) && (
						<Field label={translate('Email')} name="email" type="email" autoComplete="email" required maxLength={254} />
					)}{' '}
					{registering && (
						<>
							<Field
								label={translate('Email')}
								name="email"
								type="email"
								autoComplete="email"
								required
								maxLength={254}
							/>
							<div className="auth-phone-group">
								<div className="auth-phone-row">
									<Field label={translate('Country code')}>
										<select value={countryCode} onChange={(event) => setCountryCode(event.target.value)}>
											{['+82', '+1', '+44', '+61', '+81', '+86', '+91', '+33', '+49', '+998'].map((code) => (
												<option key={code}>{code}</option>
											))}
										</select>
									</Field>
									<Field
										label={translate('Phone number')}
										name="phoneNumber"
										type="tel"
										autoComplete="tel"
										required
										maxLength={40}
										aria-describedby="signup-phone-hint"
									/>
								</div>
								<small id="signup-phone-hint">{translate('For contact only. Sign in with your email.')}</small>
							</div>
						</>
					)}
					{(mode === 'reset-password' || (mode === 'verify-email' && !showResend)) && (
						<Field
							label={translate('Verification token')}
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
							minLength={registering || mode === 'reset-password' ? 6 : 1}
							maxLength={registering || mode === 'reset-password' ? 30 : 128}
							autoComplete={registering || mode === 'reset-password' ? 'new-password' : 'current-password'}
						/>
					)}{' '}
					{registering && (
						<>
							<Password
								label={translate('Confirm password')}
								showRequirements={false}
								name="confirmPassword"
								autoComplete="new-password"
								required
								minLength={6}
								maxLength={30}
							/>
						</>
					)}
					{mode === 'sign-in' && (
						<Link passHref className="forgot" href={authHref('/account/forgot-password')}>
							{translate('Forgot password?')}
						</Link>
					)}
					<Feedback {...action} />
					{mode === 'sign-in' && /verif/i.test(action.error) && (
						<Link href={authHref('/account/verify-email')}>{translate('Verify email or resend')}</Link>
					)}
					{message && <Notice notify>{message}</Notice>}
					<Button type="submit" disabled={action.busy}>
						{action.busy
							? translate('Please wait…')
							: mode === 'sign-in'
							? translate('Sign in')
							: registering
							? translate('Create account')
							: mode === 'forgot-password'
							? translate('Send reset link')
							: mode === 'reset-password'
							? translate('Reset password')
							: showResend
							? translate('Resend verification email')
							: translate('Verify email')}
					</Button>
				</form>
				{auth && <SocialButtons />}
				{mode === 'verify-email' && (
					<div className="verification-resend">
						<p>{translate('Need another verification email?')}</p>
						<Button secondary className="resend-button" onClick={() => setShowResend(!showResend)}>
							{showResend ? translate('Use a verification token') : translate('Resend email')}
						</Button>
					</div>
				)}
				<p className="auth-bottom">
					{mode === 'sign-in' ? (
						<>
							{translate('Don’t have an account?')}{' '}
							<Link passHref href={authHref('/account/register')}>
								{translate('Create an account')}
							</Link>
						</>
					) : (
						<Link passHref href={authHref('/account/sign-in')}>
							{translate('Back to sign in')}
						</Link>
					)}
				</p>
			</section>
		</>
	);
}
