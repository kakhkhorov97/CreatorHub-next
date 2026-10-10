import ChangePasswordSettings from '../../libs/components/account/ChangePasswordSettings';
import ChangeEmailSettings from '../../libs/components/account/ChangeEmailSettings';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import { Button, Confirm, Feedback, Heading, QueryState } from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useAction, useApi } from '../../libs/hooks/useApi';

export default function SignInMethods() {
	const { t } = useTranslation('common');
	return (
		<Layout title={t('Sign-in methods')} area="account">
			<Guard>
				<AccountSecurity />
			</Guard>
		</Layout>
	);
}

function AccountSecurity() {
	const { t } = useTranslation('common');
	const identities = useApi('getMyAuthIdentities');
	const action = useAction();
	const [unlink, setUnlink] = useState<string | null>(null);
	const social = identities.value?.filter((i) => !i.revokedAt && !['EMAIL', 'PHONE'].includes(i.provider)) || [];
	return (
		<>
			<Heading title={t('Sign-in methods')} />
			<p className="muted">{t('Manage your account email and password.')}</p>
			<ChangeEmailSettings />
			<ChangePasswordSettings />
			{social.length > 0 && (
				<section className="panel identity-panel">
					<h2>{t('Linked methods')}</h2>
					<QueryState loading={identities.loading} error={identities.error} retry={identities.refetch} />
					{social.map((i) => (
						<div className="list-row" key={i._id}>
							<strong>{i.provider}</strong>
							<Button danger onClick={() => setUnlink(i._id)}>
								{t('Remove')}
							</Button>
						</div>
					))}
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
		</>
	);
}
