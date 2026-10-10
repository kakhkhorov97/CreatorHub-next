import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { authenticationDestination, safeReturnTo, saveSession } from '../../auth';
import { useAction } from '../../hooks/useApi';
import { AuthFieldErrors, authSubmissionErrorField, validateAuthForm } from '../../utils/authForm';
import GoogleSignIn from './GoogleSignIn';
import { Button, Field, Notice, Password, values } from '../common/UI';

export type AuthMode = 'sign-in' | 'register' | 'forgot-password' | 'reset-password';
const titles = {
	'sign-in': 'Welcome back',
	register: 'Create your account',
	'forgot-password': 'Forgot your password?',
	'reset-password': 'Choose a new password',
};

export function SocialButtons({
	onSetupChange = () => {},
	setup = false,
}: {
	onSetupChange?(setup: boolean): void;
	setup?: boolean;
}) {
	const { t: translate } = useSiteTranslation('common');

	return (
		<div className="social-sign-in">
			{!setup && <p className="divider-label">{translate('Or continue with')}</p>}
			<GoogleSignIn onSetupChange={onSetupChange} />
			{!setup && (
				<>
					{['Kakao', 'Telegram'].map((provider) => (
						<Button key={provider} secondary disabled>
							{translate('Continue with')} {provider}
						</Button>
					))}
					<small>{translate('Kakao and Telegram sign-in are not available yet.')}</small>
				</>
			)}
		</div>
	);
}

export default function Auth({ mode }: { mode: AuthMode }) {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const [googleSetup, setGoogleSetup] = useState(false);
	const [countryCode, setCountryCode] = useState('+82');
	const action = useAction();
	const [message, setMessage] = useState('');
	const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
	const auth = mode === 'sign-in' || mode === 'register';
	const registering = mode === 'register';
	const returnTo = typeof router.query.returnTo === 'string' ? safeReturnTo(router.query.returnTo) : undefined;
	const authHref = (path: string) => (returnTo ? `${path}?returnTo=${encodeURIComponent(returnTo)}` : path);
	useEffect(() => {
		if (returnTo) sessionStorage.setItem('creatorhub.returnTo', returnTo);
	}, [returnTo]);

	useEffect(() => {
		if (action.error) setFieldErrors({ [authSubmissionErrorField(action.error, mode)]: action.error });
	}, [action.error, mode]);

	async function submit(form: HTMLFormElement) {
		action.setError('');
		const errors = validateAuthForm(form, registering);
		setFieldErrors(errors);
		if (Object.keys(errors).length) {
			form.querySelector<HTMLInputElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus();
			return;
		}
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
					sessionStorage.setItem('creatorhub.pendingEmail', f.email.trim());
					await router.push(authHref('/account/check-email'));
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
			}
		});
	}
	return (
		<>
			<Link passHref className="back-link" href="/">
				{translate('Back to explore')}
			</Link>
			<div className={auth ? 'auth-layout has-artwork' : 'auth-layout'}>
				<section className="auth-panel panel">
					<h1>{translate(googleSetup ? 'Complete your account' : titles[mode])}</h1>
					{router.query.passwordChanged === '1' && (
						<Notice notify>{translate('Password updated. Sign in again to continue.')}</Notice>
					)}
					<p className="muted auth-intro">
						{googleSetup
							? translate('Add your contact details to finish creating your account.')
							: auth
							? registering
								? translate('Save creative work and start conversations with creators.')
								: translate('Sign in to explore creators, save portfolios, and send project inquiries.')
							: mode === 'forgot-password'
							? translate('Enter the email linked to your account.')
							: translate('Choose a password you do not use for another account.')}
					</p>

					{!googleSetup && (
						<form
							noValidate
							onInput={(event) => {
								const name = (event.target as HTMLInputElement).name;
								action.setError('');
								setFieldErrors((previous) => {
									const next = { ...previous };
									delete next[name];
									return next;
								});
							}}
							key={mode}
							onSubmit={(e) => {
								e.preventDefault();
								submit(e.currentTarget);
							}}
						>
							{mode === 'sign-in' && (
								<Field
									label={translate('Email')}
									name="email"
									error={fieldErrors.email}
									type="email"
									autoComplete="email"
									required
									maxLength={254}
								/>
							)}
							{registering && (
								<Field
									label={translate('Your name')}
									name="displayName"
									error={fieldErrors.displayName}
									autoComplete="name"
									required
									minLength={3}
									maxLength={40}
								/>
							)}
							{mode === 'forgot-password' && (
								<Field
									label={translate('Email')}
									name="email"
									error={fieldErrors.email}
									type="email"
									autoComplete="email"
									required
									maxLength={254}
								/>
							)}{' '}
							{registering && (
								<>
									<Field
										label={translate('Email')}
										name="email"
										error={fieldErrors.email}
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
												error={fieldErrors.phoneNumber}
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
							{mode === 'reset-password' && (
								<Field
									label={translate('Verification token')}
									name="token"
									error={fieldErrors.token}
									required
									minLength={64}
									maxLength={64}
									defaultValue={typeof router.query.token === 'string' ? router.query.token : ''}
								/>
							)}
							{(auth || mode === 'reset-password') && (
								<Password
									name="password"
									error={fieldErrors.password}
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
										error={fieldErrors.confirmPassword}
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
									: translate('Reset password')}
							</Button>
						</form>
					)}
					{auth && <SocialButtons onSetupChange={setGoogleSetup} setup={googleSetup} />}
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
				{auth && (
					<figure className="auth-artwork">
						<div
							className="auth-artwork-image"
							role="img"
							aria-label={translate('A warm, light-filled reading room')}
						/>
						<figcaption>
							Copenhagen · A room for reading
							<small>{translate('Fictional portfolio concept · AI-generated artwork')}</small>
						</figcaption>
					</figure>
				)}
			</div>
		</>
	);
}
