import ChangePasswordSettings from './ChangePasswordSettings';
import ChangeEmailSettings from './ChangeEmailSettings';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { Button, Confirm, Feedback, QueryState } from '../common/UI';
import { useAction, useApi } from '../../hooks/useApi';
import type { AuthProvider } from '../../types/creatorhub';

const providerNames: Record<AuthProvider, string> = {
	EMAIL: 'Email',
	PHONE: 'Phone',
	GOOGLE: 'Google',
	TELEGRAM: 'Telegram',
	KAKAO: 'Kakao',
};

export default function AccountSecurity() {
	const { t } = useTranslation('common');
	const identities = useApi('getMyAuthIdentities');
	const action = useAction();
	const [unlink, setUnlink] = useState<string | null>(null);
	const social =
		identities.value?.filter((identity) => !identity.revokedAt && !['EMAIL', 'PHONE'].includes(identity.provider)) ||
		[];
	const usableMethods =
		identities.value?.filter(
			(identity) => !identity.revokedAt && identity.verifiedAt && identity.provider !== 'PHONE',
		) || [];

	return (
		<div className="sign-in-methods">
			<h2>{t('Sign-in methods')}</h2>
			<p className="muted sign-in-methods-intro">{t('Manage how you sign in to CreatorHub.')}</p>
			<div className="panel sign-in-methods-panel">
				<QueryState loading={identities.loading} error={identities.error} retry={identities.refetch} />
				{!identities.loading && !identities.error && (
					<>
						<ChangeEmailSettings />
						{social.length > 0 && (
							<section className="identity-panel linked-methods-settings">
								<h2>{t('Linked methods')}</h2>
								{social.map((identity) => {
									const onlyUsableMethod = usableMethods.length === 1 && usableMethods[0]._id === identity._id;
									const removalReasonId = `removal-reason-${identity._id}`;
									return (
										<div className="sign-in-method-row" key={identity._id}>
											<div className="sign-in-method-details">
												<div className="sign-in-method-name">
													<strong>{t(providerNames[identity.provider])}</strong>
													<span className="sign-in-method-status">{t('Connected')}</span>
												</div>
												{onlyUsableMethod && (
													<p className="muted sign-in-method-removal-reason" id={removalReasonId}>
														{t("This is your only usable sign-in method, so it can't be removed.")}
													</p>
												)}
											</div>
											<Button
												danger
												className="sign-in-method-remove"
												disabled={action.busy || onlyUsableMethod}
												aria-describedby={onlyUsableMethod ? removalReasonId : undefined}
												onClick={() => setUnlink(identity._id)}
											>
												{t('Remove')}
											</Button>
										</div>
									);
								})}
								{unlink && (
									<Confirm
										title={t('Remove this sign-in method?')}
										busy={action.busy}
										onCancel={() => setUnlink(null)}
										onConfirm={() =>
											action.run(async () => {
												await action.mutate('unlinkAuthIdentity', { authIdentityId: unlink });
												setUnlink(null);
												await identities.refetch();
											})
										}
									>
										{t('Sessions using this method will be revoked. You must keep at least one usable sign-in method.')}
									</Confirm>
								)}
								<Feedback {...action} />
							</section>
						)}
						<ChangePasswordSettings />
					</>
				)}
			</div>
		</div>
	);
}
