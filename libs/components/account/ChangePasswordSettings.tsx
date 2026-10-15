import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { clearSession } from '../../auth';
import { useAction, useApi } from '../../hooks/useApi';
import { Button, Feedback, Field, Password, QueryState, values } from '../common/UI';
import { FieldErrors, useFormValidation } from '../../hooks/useFormValidation';

export default function ChangePasswordSettings() {
	const { t } = useTranslation('common');
	const validation = useFormValidation();
	const router = useRouter();
	const identities = useApi('getMyAuthIdentities');
	const action = useAction();
	const methods =
		identities.value?.filter(
			(identity) => !identity.revokedAt && identity.provider === 'EMAIL' && identity.verifiedAt,
		) || [];

	const googleAccount = identities.value?.some((identity) => !identity.revokedAt && identity.provider === 'GOOGLE');

	return (
		<section className="panel identity-panel password-settings">
			<h2>{t(methods.length ? 'Change password' : 'Password')}</h2>
			<QueryState loading={identities.loading} error={identities.error} retry={identities.refetch} />
			{!identities.loading &&
				!identities.error &&
				(methods.length ? (
					<form
						{...validation.form}
						onSubmit={(event) => {
							event.preventDefault();
							if (!validation.validate(event.currentTarget)) return;
							const f = values(event.currentTarget);
							if (f.password !== f.confirmPassword) {
								action.setError(t('Passwords do not match. Please try again.'));
								return;
							}
							action.run(async () => {
								await action.mutate('changePassword', {
									input: {
										authIdentityId: f.authIdentityId,
										currentPassword: f.currentPassword,
										password: f.password,
									},
								});
								clearSession();
								await action.client.clearStore();
								await router.push('/account/sign-in?passwordChanged=1');
							});
						}}
					>
						<FieldErrors value={validation.errors}>
							<p className="muted">
								{t('Changing your password signs you out on all devices. Sign in again with your new password.')}
							</p>
							{methods.length > 1 ? (
								<Field label={t('Sign-in method')}>
									<select name="authIdentityId" aria-label={t('Sign-in method')} required disabled={action.busy}>
										{methods.map((identity) => (
											<option key={identity._id} value={identity._id}>
												{identity.providerSubject}
											</option>
										))}
									</select>
								</Field>
							) : (
								<input type="hidden" name="authIdentityId" value={methods[0]._id} />
							)}
							<Password
								label={t('Current password')}
								name="currentPassword"
								autoComplete="current-password"
								required
								minLength={1}
								maxLength={128}
								disabled={action.busy}
							/>
							<Password
								label={t('New password')}
								name="password"
								autoComplete="new-password"
								required
								minLength={6}
								maxLength={30}
								disabled={action.busy}
							/>
							<Password
								label={t('Confirm new password')}
								showRequirements={false}
								name="confirmPassword"
								autoComplete="new-password"
								required
								minLength={6}
								maxLength={30}
								disabled={action.busy}
							/>
							<Feedback {...action} />
							<div className="account-save-actions">
								<Button type="submit" disabled={action.busy}>
									{t('Change password')}
								</Button>
							</div>
						</FieldErrors>
					</form>
				) : (
					<p className="muted">
						{googleAccount
							? t('You signed in with Google. Your password is managed through your Google Account.')
							: t('No verified email password is linked. Social account passwords are managed by the provider.')}
					</p>
				))}
		</section>
	);
}
