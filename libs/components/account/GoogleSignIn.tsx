import { discardSocialChallenge, getSocialChallenge } from '../../auth/socialChallenge';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { authenticationDestination, safeReturnTo, saveSession } from '../../auth';
import { useAction } from '../../hooks/useApi';
import { AuthPayload, GoogleSignInResult } from '../../types/creatorhub';
import { AuthFieldErrors, validateAuthForm } from '../../utils/authForm';
import { Button, Field, values } from '../common/UI';

type GoogleIdentity = {
	initialize(options: {
		client_id: string;
		nonce: string;
		callback(response: { credential: string }): void;
		ux_mode: string;
		auto_select: boolean;
	}): void;
	renderButton(
		container: HTMLElement,
		options: { type: string; theme: string; size: string; text: string; width: number },
	): void;
};
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignIn({
	onSetupChange,
	onFeedbackChange,
}: {
	onSetupChange(setup: boolean): void;
	onFeedbackChange?(feedback: ReactNode): void;
}) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const action = useAction();
	const container = useRef<HTMLDivElement>(null);
	const callback = useRef<(credential: string) => void>(() => {});
	const [ready, setReady] = useState(false);
	const [nonce, setNonce] = useState('');
	const [pending, setPending] = useState<GoogleSignInResult | null>(null);
	const [errors, setErrors] = useState<AuthFieldErrors>({});
	const [countryCode, setCountryCode] = useState('+82');
	const [scriptError, setScriptError] = useState(false);
	const [retry, setRetry] = useState(false);

	async function prepare() {
		setRetry(false);
		setNonce('');
		const challenge = await action.run(() =>
			getSocialChallenge('GOOGLE', () => action.mutate('beginSocialLogin', { provider: 'GOOGLE' })),
		);
		if (challenge) setNonce(challenge);
		else setRetry(true);
	}
	useEffect(() => {
		if (clientId) void prepare();
		// One challenge for this mounted sign-in surface.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	async function finish(session: AuthPayload) {
		saveSession(session);
		await action.client.clearStore();
		const returnTo = typeof router.query.returnTo === 'string' ? safeReturnTo(router.query.returnTo) : undefined;
		await router.push(
			authenticationDestination(returnTo, sessionStorage.getItem('creatorhub.returnTo'), session.user.role),
		);
		sessionStorage.removeItem('creatorhub.returnTo');
		sessionStorage.removeItem('creatorhub.pendingEmail');
	}
	callback.current = (credential) => {
		if (action.busy || action.retryAfter > 0 || pending) return;
		discardSocialChallenge('GOOGLE');
		void action
			.run(async () => {
				const result = await action.mutate('loginGoogle', { input: { idToken: credential, nonce } });
				if (result.session) await finish(result.session);
				else if (result.signupToken) {
					setPending(result);
					onSetupChange(true);
				} else throw new Error('Google sign-in could not be completed. Please try again.');
				return true;
			})
			.then((success) => {
				if (!success) {
					setRetry(true);
					setNonce('');
				}
			});
	};
	useEffect(() => {
		const identity = (window as Window & { google?: { accounts: { id: GoogleIdentity } } }).google?.accounts.id;
		if (!ready || !nonce || !clientId || !container.current || pending || !identity) return;
		const host = container.current;
		identity.initialize({
			client_id: clientId,
			nonce,
			ux_mode: 'popup',
			auto_select: false,
			callback: (response) => callback.current(response.credential),
		});
		let renderedWidth = 0;
		let frame = 0;
		const render = () => {
			const width = Math.min(400, Math.floor(host.clientWidth || 280));
			if (width === renderedWidth) return;
			renderedWidth = width;
			host.replaceChildren();
			identity.renderButton(host, {
				type: 'standard',
				theme: 'outline',
				size: 'large',
				text: 'continue_with',
				width,
			});
		};
		render();
		const observer = new ResizeObserver(() => {
			window.cancelAnimationFrame(frame);
			frame = window.requestAnimationFrame(render);
		});
		observer.observe(host);
		return () => {
			observer.disconnect();
			window.cancelAnimationFrame(frame);
			host.replaceChildren();
		};
	}, [ready, nonce, pending]);

	const feedback = (
		<div className="provider-feedback" aria-live="polite">
			{action.retryAfter > 0 ? (
				<p role="status">{t('Please wait {{seconds}} seconds before trying again.', { seconds: action.retryAfter })}</p>
			) : scriptError ? (
				<p className="field-error" role="alert">
					{t('Google sign-in could not load. Refresh the page and try again.')}
				</p>
			) : action.error ? (
				<p className="field-error" role="alert">
					{t(action.error)}
				</p>
			) : !ready ? (
				<p role="status">{t('Loading Google sign-in…')}</p>
			) : null}
		</div>
	);
	useEffect(() => {
		if (onFeedbackChange) onFeedbackChange(feedback);
		// The parent setter is stable; feedback depends only on these status values.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onFeedbackChange, action.retryAfter, action.error, scriptError, ready, t]);
	if (!clientId) return <p className="muted">{t('Google sign-in is not configured yet.')}</p>;
	return (
		<div className="google-sign-in">
			<Script
				src="https://accounts.google.com/gsi/client"
				strategy="afterInteractive"
				onReady={() => setReady(true)}
				onError={() => setScriptError(true)}
			/>
			{pending ? (
				<form
					noValidate
					onInput={() => setErrors({})}
					onSubmit={async (event) => {
						event.preventDefault();
						const form = event.currentTarget;
						const validation = validateAuthForm(form);
						setErrors(validation);
						if (Object.keys(validation).length) return;
						const fields = values(form);
						const digits = fields.phoneNumber.replace(/[^\d+]/g, '');
						const phoneNumber = digits.startsWith('+')
							? digits
							: countryCode + (countryCode === '+82' ? digits.replace(/^0/, '') : digits);
						await action.run(async () => {
							try {
								const session = await action.mutate('completeGoogleSignup', {
									input: {
										signupToken: pending.signupToken!,
										displayName: fields.displayName.trim(),
										phoneNumber,
										preferredLocale: router.locale === 'ko' ? 'ko' : router.locale === 'uz' ? 'uz' : 'en',
									},
								});
								await finish(session);
							} catch (error) {
								const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
								if (/phone|displayName/i.test(message)) {
									setErrors({ [/phone/i.test(message) ? 'phoneNumber' : 'displayName']: message });
									return;
								}
								throw error;
							}
						});
					}}
				>
					<Field
						label={t('Your name')}
						name="displayName"
						defaultValue={pending.displayName || ''}
						autoComplete="name"
						required
						minLength={2}
						maxLength={60}
						error={errors.displayName}
						disabled={action.busy || action.retryAfter > 0}
					/>
					<div className="auth-phone-group">
						<div className="auth-phone-row">
							<Field label={t('Country code')}>
								<select
									value={countryCode}
									onChange={(e) => setCountryCode(e.target.value)}
									disabled={action.busy || action.retryAfter > 0}
								>
									{['+82', '+1', '+44', '+61', '+81', '+86', '+91', '+33', '+49', '+998'].map((code) => (
										<option key={code}>{code}</option>
									))}
								</select>
							</Field>
							<Field
								label={t('Phone number')}
								name="phoneNumber"
								type="tel"
								autoComplete="tel"
								required
								maxLength={40}
								error={errors.phoneNumber}
								disabled={action.busy || action.retryAfter > 0}
							/>
						</div>
						<small>{t('For contact only. Continue signing in with Google.')}</small>
					</div>
					<Button type="submit" disabled={action.busy || action.retryAfter > 0}>
						{t(action.busy ? 'Please wait…' : 'Create account')}
					</Button>
					<Button
						secondary
						disabled={action.busy || action.retryAfter > 0}
						onClick={() => {
							setPending(null);
							onSetupChange(false);
							setErrors({});
							void prepare();
						}}
					>
						{t('Back')}
					</Button>
				</form>
			) : (
				<>
					{!scriptError && !retry && (
						<div
							ref={container}
							className="google-button"
							aria-busy={action.busy}
							style={{ pointerEvents: action.busy || action.retryAfter > 0 ? 'none' : undefined }}
						/>
					)}

					{retry && (
						<Button secondary disabled={action.busy || action.retryAfter > 0} onClick={() => void prepare()}>
							{t('Try again')}
						</Button>
					)}
				</>
			)}
			{!onFeedbackChange && feedback}
		</div>
	);
}
