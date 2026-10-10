import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { useAction, useApi } from '../../hooks/useApi';
import { AuthFieldErrors, validateAuthForm } from '../../utils/authForm';
import { Button, Field, Password, QueryState, values } from '../common/UI';

export default function ChangeEmailSettings() {
	const { t } = useTranslation('common');
	const identities = useApi('getMyAuthIdentities');
	const action = useAction();
	const [editing, setEditing] = useState(false);
	const [errors, setErrors] = useState<AuthFieldErrors>({});
	const [sentTo, setSentTo] = useState('');
	const email = identities.value?.find((i) => !i.revokedAt && i.provider === 'EMAIL');
	function clearErrors() {
		setErrors({});
		action.setError('');
	}
	return (
		<section className="panel identity-panel email-settings">
			<h2>{t('Account email')}</h2>
			<QueryState loading={identities.loading} error={identities.error} retry={identities.refetch} />
			{email && (
				<>
					<div className="list-row">
						<div>
							<strong>{email.providerSubject}</strong>
							<p className="muted">{t(email.verifiedAt ? 'Verified email' : 'Not verified')}</p>
						</div>
						{email.verifiedAt && !editing && (
							<Button
								secondary
								onClick={() => {
									clearErrors();
									setEditing(true);
								}}
							>
								{t('Change email')}
							</Button>
						)}
					</div>
					{sentTo && (
						<p className="confirmation-status" role="status">
							{t('Confirmation sent to {{email}}. Your current email stays active until you verify the replacement.', {
								email: sentTo,
							})}
						</p>
					)}
					{editing && (
						<form
							noValidate
							onSubmit={async (event) => {
								event.preventDefault();
								const form = event.currentTarget;
								const validation = validateAuthForm(form);
								setErrors(validation);
								if (Object.keys(validation).length) return;
								const fields = values(form);
								const sent = await action.run(async () => {
									try {
										return await action.mutate('requestEmailChange', {
											input: { email: fields.email.trim(), currentPassword: fields.currentPassword },
										});
									} catch (error) {
										const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
										setErrors({ [/password/i.test(message) ? 'currentPassword' : 'email']: message });
										return false;
									}
								});
								if (sent) {
									setSentTo(fields.email.trim());
									form.reset();
									setEditing(false);
								}
							}}
						>
							<p className="muted">
								{t('We will send a confirmation link to your new email. Verifying it signs you out on all devices.')}
							</p>
							<Field
								label={t('New email')}
								name="email"
								type="email"
								autoComplete="email"
								required
								maxLength={254}
								error={errors.email}
								disabled={action.busy}
								onChange={clearErrors}
							/>
							<Password
								label={t('Current password')}
								name="currentPassword"
								autoComplete="current-password"
								required
								minLength={1}
								maxLength={128}
								showRequirements={false}
								error={errors.currentPassword}
								disabled={action.busy}
								onChange={clearErrors}
							/>
							<div className="account-save-actions">
								<Button type="submit" disabled={action.busy}>
									{t(action.busy ? 'Please wait…' : 'Send confirmation email')}
								</Button>
								<Button
									type="button"
									secondary
									disabled={action.busy}
									onClick={() => {
										clearErrors();
										setEditing(false);
									}}
								>
									{t('Cancel')}
								</Button>
							</div>
						</form>
					)}
				</>
			)}
			{!identities.loading && !identities.error && !email && (
				<p className="muted">{t('No email login is linked to this account.')}</p>
			)}
		</section>
	);
}
