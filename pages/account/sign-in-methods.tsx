import ChangePasswordSettings from '../../libs/components/account/ChangePasswordSettings';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useState } from 'react';
import { SocialButtons } from '../../libs/components/account/Auth';
import {
	Button,
	Confirm,
	date,
	Feedback,
	Field,
	Heading,
	Notice,
	Password,
	values,
} from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useAction, useApi } from '../../libs/hooks/useApi';

function SignInMethods() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Sign-in methods')} area="account">
			<Guard>
				<IdentitySettings />
			</Guard>
		</Layout>
	);
}

function IdentitySettings() {
	const { t: translate } = useSiteTranslation('common');

	const identities = useApi('getMyAuthIdentities');
	const action = useAction();
	const [unlink, setUnlink] = useState<string | null>(null);
	const [message, setMessage] = useState('');
	return (
		<>
			<Heading title={translate('Sign-in methods')} />
			<p className="muted">
				{translate('Manage the ways you sign in. Sign in again before linking or removing a method.')}
			</p>
			<QueryIdentities />
			<section className="panel identity-panel">
				<h2>{translate('Linked methods')}</h2>
				{identities.value
					?.filter((i) => !i.revokedAt && i.provider !== 'PHONE')
					.map((i) => (
						<div className="list-row" key={i._id}>
							<div>
								<strong>{i.provider}</strong>
								<p>{['EMAIL', 'PHONE'].includes(i.provider) ? i.providerSubject : translate('Connected account')}</p>
								<small>{i.verifiedAt ? `Verified ${date(i.verifiedAt)}` : translate('Not verified')}</small>
							</div>
							<Button danger onClick={() => setUnlink(i._id)}>
								{translate('Remove')}
							</Button>
						</div>
					))}
				{unlink && (
					<Confirm
						title={translate('Remove this sign-in method?')}
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
						{translate('Sessions using this method will be revoked. You must keep at least one usable sign-in method.')}
					</Confirm>
				)}
			</section>
			<section className="panel identity-panel">
				<h2>{translate('Add a sign-in method')}</h2>

				<form
					onSubmit={(e) => {
						e.preventDefault();
						const f = values(e.currentTarget);
						action.run(async () => {
							await action.mutate('linkEmail', { input: { email: f.identifier, password: f.password } });
							setMessage('Check your inbox to verify the new email.');
							await identities.refetch();
						});
					}}
				>
					<Field label={translate('Email')} name="identifier" type="email" required maxLength={254} />
					<Password name="password" required minLength={6} maxLength={30} autoComplete="new-password" />
					<Button type="submit" disabled={action.busy}>
						{translate('Link email')}
					</Button>
				</form>
				<SocialButtons />
			</section>
			<ChangePasswordSettings />
			<Feedback {...action} />
			{message && <Notice notify>{message}</Notice>}
		</>
	);

	function QueryIdentities() {
		const { t: translate } = useSiteTranslation('common');

		return identities.error ? (
			<Notice error>{identities.error.message}</Notice>
		) : identities.loading ? (
			<p role="status">{translate('Loading sign-in methods…')}</p>
		) : null;
	}
}

export default SignInMethods;
