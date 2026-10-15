import { ArrowLeft } from 'phosphor-react';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';
import { authenticationDestination, safeReturnTo, saveSession } from '../../auth';
import { useAction } from '../../hooks/useApi';
import { AuthFieldErrors, authSubmissionErrorField, validateAuthForm } from '../../utils/authForm';
import GoogleSignIn from './GoogleSignIn';
import ProviderSignIn from './ProviderSignIn';
import { Button, Field, LinkButton, Notice, Password, values } from '../common/UI';

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
	const [googleFeedback, setGoogleFeedback] = useState<ReactNode>(null);
	const [providerFeedback, setProviderFeedback] = useState<ReactNode>(null);
	const [activeProvider, setActiveProvider] = useState<'GOOGLE' | 'OTHER'>('GOOGLE');
	return (
		<div className="social-sign-in">
			{!setup && <p className="divider-label">{translate('Or continue with')}</p>}
			{(!setup || activeProvider === 'GOOGLE') && (
				<GoogleSignIn
					onFeedbackChange={setGoogleFeedback}
					onSetupChange={(value) => {
						setActiveProvider('GOOGLE');
						onSetupChange(value);
					}}
				/>
			)}
			{(!setup || activeProvider === 'OTHER') && (
				<ProviderSignIn
					onFeedbackChange={setProviderFeedback}
					onSetupChange={(value) => {
						setActiveProvider('OTHER');
						onSetupChange(value);
					}}
				/>
			)}
			<div className="social-feedback" aria-live="polite">
				{(!setup || activeProvider === 'GOOGLE') && googleFeedback}
				{(!setup || activeProvider === 'OTHER') && providerFeedback}
			</div>
		</div>
	);
}

const PHONE_FORMAT = 'Enter a valid phone number with its country code, for example +82 10 1234 5678.';

export default function Auth({ mode }: { mode: AuthMode }) {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const [socialSetup, setSocialSetup] = useState(false);
	const [countryCode, setCountryCode] = useState('+82');
	const action = useAction();
	const [message, setMessage] = useState('');
	const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
	const auth = mode === 'sign-in' || mode === 'register';
	const registering = mode === 'register';
	const returnTo = typeof router.query.returnTo === 'string' ? safeReturnTo(router.query.returnTo) : undefined;
	// The reset token only ever comes from the emailed link. It is never shown or typed.
	const resetToken = typeof router.query.token === 'string' ? router.query.token : '';
	const resetLinkBroken = mode === 'reset-password' && router.isReady && !/^[a-f0-9]{64}$/.test(resetToken);
	const resetLinkUsed = mode === 'reset-password' && /invalid or expired token/i.test(action.error);
	const authHref = (path: string) =>
		returnTo ? `${path}${path.includes('?') ? '&' : '?'}returnTo=${encodeURIComponent(returnTo)}` : path;
	useEffect(() => {
		if (returnTo) sessionStorage.setItem('creatorhub.returnTo', returnTo);
	}, [returnTo]);

	useEffect(() => {
		// The account exists even though the email failed, so continue to the page that can resend it.
		if (registering && /verification email could not be sent/i.test(action.error)) {
			void router.push(authHref('/account/check-email?sendFailed=1'));
			return;
		}
		if (action.error) setFieldErrors({ [authSubmissionErrorField(action.error, mode)]: action.error });
		// eslint-disable-next-line react-hooks/exhaustive-deps
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
			// Same shape the server accepts (E.164). The server also checks the number is real for its country.
			if (!/^\+[1-9]\d{7,14}$/.test(f.phoneNumber.replace(/[\s()-]/g, ''))) {
				setFieldErrors({ phoneNumber: PHONE_FORMAT });
				form.querySelector<HTMLInputElement>('[name="phoneNumber"]')?.focus();
				return;
			}
		}

		setMessage('');
		if (registering) sessionStorage.setItem('creatorhub.pendingEmail', f.email.trim());
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
				setMessage('If an account exists for this email, you’ll receive a password reset link. Check your spam folder too.');
			} else if (mode === 'reset-password') {
				await action.mutate('resetPassword', { input: { token: resetToken, password: f.password } });
				// Leave the single-use link behind so it cannot be submitted a second time.
				await router.replace('/account/sign-in?passwordChanged=1');
			}
		});
	}
	return (
		<div className={`auth-page${auth ? ' has-pattern' : ''}${auth ? ' is-compact-auth' : ''}`}>
			<Link
				passHref
				className="back-link"
				href="/"
				aria-label={translate('Back to explore')}
				title={translate('Back to explore')}
			>
				<ArrowLeft size={22} aria-hidden />
			</Link>
			<div className={auth ? 'auth-layout has-artwork' : 'auth-layout'}>
				<section className="auth-panel panel">
					<h1>{translate(socialSetup ? 'Complete your account' : titles[mode])}</h1>
					{router.query.passwordChanged === '1' && (
						<Notice notify>{translate('Password updated. Sign in again to continue.')}</Notice>
					)}
					<p className="muted auth-intro">
						{socialSetup
							? translate('Add your contact details to finish creating your account.')
							: auth
							? registering
								? translate('Save creative work and start conversations with creators.')
								: translate('Sign in to explore creators, save portfolios, and send project inquiries.')
							: mode === 'forgot-password'
							? translate('Enter the email linked to your account.')
							: translate('Choose a password you do not use for another account.')}
					</p>

					{(resetLinkBroken || resetLinkUsed) && (
						<div className="notice error" role="alert">
							<p>
								{resetLinkUsed
									? translate('This reset link has expired or was already used. Links work once and expire after 30 minutes.')
									: translate('This reset link is incomplete. Open the link from your email again.')}
							</p>
							<LinkButton secondary href={authHref('/account/forgot-password')}>
								{translate('Request a new link')}
							</LinkButton>
						</div>
					)}
					{!socialSetup && !resetLinkBroken && !resetLinkUsed && (
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
												placeholder="10 1234 5678"
												aria-describedby="signup-phone-hint"
											/>
										</div>
										<small id="signup-phone-hint">{translate('For contact only. Sign in with your email.')}</small>
									</div>
								</>
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
							{message && <Notice notify={mode !== 'forgot-password'}>{message}</Notice>}
							{message && mode === 'forgot-password' && (
								<p>
									{translate('New to CreatorHub?')}{' '}
									<Link href={authHref('/account/register')}>{translate('Create an account')}</Link>
								</p>
							)}
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
					{auth && <SocialButtons onSetupChange={setSocialSetup} setup={socialSetup} />}
					<p className="auth-bottom">
						{mode === 'sign-in' ? (
							<>
								<span>{translate('Don’t have an account?')}</span>
								<LinkButton secondary href={authHref('/account/register')}>
									{translate('Create an account')}
								</LinkButton>
							</>
						) : (
							<Link
								passHref
								href={authHref('/account/sign-in')}
								aria-label={translate('Back to sign in')}
								title={translate('Back to sign in')}
							>
								<ArrowLeft size={22} aria-hidden />
							</Link>
						)}
					</p>
				</section>
				{auth && (
					<figure className="auth-artwork">
						<div
							className="auth-artwork-image"
							role="img"
							aria-label={translate(
								'CreatorHub creative workspace with design, illustration, and photography materials',
							)}
						/>
					</figure>
				)}
			</div>
		</div>
	);
}
