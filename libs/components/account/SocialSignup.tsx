import { readableError } from '../../utils/errors';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useAction } from '../../hooks/useApi';
import { AuthPayload, SocialSignInResult } from '../../types/creatorhub';
import { authenticationDestination, safeReturnTo, saveSession } from '../../auth';
import { AuthFieldErrors, validateAuthForm } from '../../utils/authForm';
import { Button, Field, values } from '../common/UI';

export async function finishSocialSession(
	action: ReturnType<typeof useAction>,
	router: ReturnType<typeof useRouter>,
	session: AuthPayload,
	destination?: string,
) {
	saveSession(session);
	await action.client.clearStore();
	const returnTo =
		destination || (typeof router.query.returnTo === 'string' ? safeReturnTo(router.query.returnTo) : undefined);
	await router.push(
		authenticationDestination(returnTo, sessionStorage.getItem('creatorhub.returnTo'), session.user.role),
	);
	sessionStorage.removeItem('creatorhub.returnTo');
	sessionStorage.removeItem('creatorhub.pendingEmail');
}

export default function SocialSignup({
	pending,
	provider,
	onBack,
	destination,
}: {
	pending: SocialSignInResult;
	provider: 'KAKAO' | 'TELEGRAM';
	onBack(): void;
	destination?: string;
}) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const action = useAction();
	const [errors, setErrors] = useState<AuthFieldErrors>({});
	const [countryCode, setCountryCode] = useState('+82');
	return (
		<div className="google-sign-in">
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
							const session = await action.mutate('completeSocialSignup', {
								input: {
									signupToken: pending.signupToken!,
									provider,
									displayName: fields.displayName.trim(),
									phoneNumber,
									preferredLocale: router.locale === 'ko' ? 'ko' : router.locale === 'uz' ? 'uz' : 'en',
								},
							});
							await finishSocialSession(action, router, session, destination);
						} catch (error) {
							const message = error ? readableError(error) : 'Something went wrong. Please try again.';
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
					disabled={action.busy}
				/>
				<div className="auth-phone-group">
					<div className="auth-phone-row">
						<Field label={t('Country code')}>
							<select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} disabled={action.busy}>
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
							disabled={action.busy}
						/>
					</div>
					<small>
						{t('For contact only. Continue signing in with {{provider}}.', {
							provider: provider === 'KAKAO' ? 'Kakao' : 'Telegram',
						})}
					</small>
				</div>
				<Button type="submit" disabled={action.busy}>
					{t(action.busy ? 'Please wait…' : 'Create account')}
				</Button>
				<Button secondary disabled={action.busy} onClick={onBack}>
					{t('Back')}
				</Button>
			</form>
			{action.error && (
				<p className="field-error" role="alert">
					{t(action.error)}
				</p>
			)}
		</div>
	);
}
