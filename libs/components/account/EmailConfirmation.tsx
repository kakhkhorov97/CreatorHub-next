import { ArrowLeft } from 'phosphor-react';
import { useTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { CheckCircle, EnvelopeSimple } from 'phosphor-react';
import { useEffect, useRef, useState } from 'react';
import { clearSession, safeReturnTo } from '../../auth';
import { useAction } from '../../hooks/useApi';
import { validateAuthForm } from '../../utils/authForm';
import { Button, Field, LinkButton, values } from '../common/UI';

type VerificationState = 'waiting' | 'verifying' | 'verified' | 'failed';

export default function EmailConfirmation({ verifyLink = false }: { verifyLink?: boolean }) {
	const { t: translate } = useTranslation('common');
	const router = useRouter();
	const action = useAction();
	const [email, setEmail] = useState('');
	const [error, setError] = useState('');
	const [resent, setResent] = useState(false);
	const [showEmailForm, setShowEmailForm] = useState(false);
	const [state, setState] = useState<VerificationState>('waiting');
	const attemptedToken = useRef<string | null>(null);
	const emailChange = router.query.purpose === 'email-change';
	const token = typeof router.query.token === 'string' ? router.query.token : '';
	const returnTo = typeof router.query.returnTo === 'string' ? safeReturnTo(router.query.returnTo) : undefined;
	const signInHref = returnTo ? `/account/sign-in?returnTo=${encodeURIComponent(returnTo)}` : '/account/sign-in';
	useEffect(() => {
		setEmail(sessionStorage.getItem('creatorhub.pendingEmail') || '');
	}, []);

	async function verify() {
		setError('');
		if (!/^[a-f0-9]{64}$/.test(token)) {
			setState('failed');
			return;
		}
		setState('verifying');
		const verified = await action.run(() => action.mutate('verifyEmail', { token }));
		if (verified) {
			if (emailChange) {
				clearSession();
				await action.client.clearStore();
			}
			setState('verified');
			sessionStorage.removeItem('creatorhub.pendingEmail');
		} else setState('failed');
	}

	useEffect(() => {
		if (!verifyLink || !router.isReady || !token || attemptedToken.current === token) return;
		attemptedToken.current = token;
		void verify();
		// One request per email link, including React Strict Mode effect replays.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [verifyLink, router.isReady, token]);

	async function resend(form?: HTMLFormElement) {
		setError('');
		setResent(false);
		if (!email && !form) {
			setShowEmailForm(true);
			return;
		}
		if (form) {
			const errors = validateAuthForm(form);
			if (errors.email) {
				setError(errors.email);
				return;
			}
		}
		const address = form ? values(form).email.trim() : email;
		const sent = await action.run(async () => {
			await action.mutate('requestEmailVerification', { input: { email: address } });
			return true;
		});
		if (sent) {
			setEmail(address);
			sessionStorage.setItem('creatorhub.pendingEmail', address);
			setShowEmailForm(false);
			setResent(true);
		}
	}

	const invalidLink = state === 'failed' && (!action.error || /token|expired/i.test(action.error));
	return (
		<section className="auth-panel panel email-confirmation">
			{state === 'verified' ? (
				<CheckCircle className="confirmation-icon" size={36} aria-hidden="true" />
			) : (
				<EnvelopeSimple className="confirmation-icon" size={36} aria-hidden="true" />
			)}
			<h1>
				{translate(
					state === 'verified'
						? 'Email verified'
						: state === 'verifying'
						? 'Verifying your email…'
						: state === 'failed'
						? 'Unable to verify your email'
						: 'Verify your email',
				)}
			</h1>
			{state === 'verified' ? (
				<>
					<p className="auth-intro" role="status">
						{translate(
							emailChange
								? 'Your email has been changed. Sign in with your new email.'
								: 'Your account is verified. You can now sign in.',
						)}
					</p>
					<LinkButton href={signInHref}>{translate('Sign in')}</LinkButton>
				</>
			) : state === 'verifying' ? (
				<p className="auth-intro" role="status">
					{translate('Please wait while we confirm your account.')}
				</p>
			) : (
				<>
					{state === 'failed' ? (
						<>
							<p className="field-error" role="alert">
								{translate(
									invalidLink
										? emailChange
											? 'This confirmation link is invalid or has expired. Request a new change in account settings.'
											: 'This confirmation link is invalid or has expired. Request a new email below.'
										: 'We could not verify your email. Please try again.',
								)}
							</p>
							{!invalidLink && (
								<Button className="confirmation-text-action" disabled={action.busy} onClick={() => void verify()}>
									{translate('Try again')}
								</Button>
							)}
						</>
					) : (
						<>
							{email && (
								<p className="confirmation-address">
									{translate('We have sent a confirmation link to')} <strong>{email}</strong>.
								</p>
							)}
							<p className="auth-intro">{translate('Open the link to verify your account, then sign in.')}</p>
						</>
					)}
					{emailChange ? (
						<Link
							className="confirmation-sign-in"
							href="/account/sign-in-methods"
							aria-label={translate('Back to account settings')}
							title={translate('Back to account settings')}
						>
							<ArrowLeft size={22} aria-hidden />
						</Link>
					) : showEmailForm ? (
						<form
							noValidate
							onSubmit={(event) => {
								event.preventDefault();
								void resend(event.currentTarget);
							}}
						>
							<Field
								label={translate('Email')}
								name="email"
								type="email"
								autoComplete="email"
								required
								maxLength={254}
								error={error || action.error}
								onChange={() => {
									setError('');
									action.setError('');
								}}
							/>
							<Button type="submit" secondary disabled={action.busy}>
								{translate(action.busy ? 'Please wait…' : 'Resend email')}
							</Button>
						</form>
					) : (
						<p className="confirmation-resend">
							{translate('Did not receive it?')}{' '}
							<Button className="confirmation-text-action" disabled={action.busy} onClick={() => void resend()}>
								{translate(action.busy ? 'Please wait…' : 'Resend email')}
							</Button>
						</p>
					)}
					{!showEmailForm && action.error && state !== 'failed' && (
						<p className="field-error" role="alert">
							{translate(action.error)}
						</p>
					)}
					{resent && (
						<p className="confirmation-status" role="status">
							{translate('If verification is needed, a new link will be sent.')}
						</p>
					)}
					<Link
						className="confirmation-sign-in"
						href={signInHref}
						aria-label={translate('Back to sign in')}
						title={translate('Back to sign in')}
					>
						<ArrowLeft size={22} aria-hidden />
					</Link>
				</>
			)}
		</section>
	);
}
