import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { clearSession } from '../../libs/auth';
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

	const router = useRouter();
	const identities = useApi('getMyAuthIdentities');
	const action = useAction();
	const [unlink, setUnlink] = useState<string | null>(null);
	const [method, setMethod] = useState('email');
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
					?.filter((i) => !i.revokedAt)
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
				<div className="tabs equal">
					{['email', 'phone'].map((m) => (
						<button key={m} className={method === m ? 'active' : ''} onClick={() => setMethod(m)}>
							{m === 'email' ? translate('Email') : translate('Phone')}
						</button>
					))}
				</div>
				<form
					key={method}
					onSubmit={(e) => {
						e.preventDefault();
						const f = values(e.currentTarget);
						action.run(async () => {
							if (method === 'email')
								await action.mutate('linkEmail', { input: { email: f.identifier, password: f.password } });
							else await action.mutate('linkPhone', { input: { phoneNumber: f.identifier, password: f.password } });
							setMessage(method === 'email' ? 'Check your inbox to verify the new email.' : 'Phone sign-in added.');
							await identities.refetch();
						});
					}}
				>
					<Field
						label={method === 'email' ? translate('Email') : translate('Phone number')}
						name="identifier"
						type={method === 'email' ? 'email' : 'tel'}
						required
						maxLength={254}
						placeholder={method === 'phone' ? '+821012345678' : undefined}
					/>
					<Password name="password" required minLength={6} maxLength={30} autoComplete="new-password" />
					<Button type="submit" disabled={action.busy}>
						{translate('Link')} {method}
					</Button>
				</form>
				<SocialButtons />
			</section>
			<section className="panel identity-panel">
				<h2>{translate('Change phone password')}</h2>
				<p>{translate('You need another linked sign-in method to change this password.')}</p>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						const f = values(e.currentTarget);
						action.run(async () => {
							await action.mutate('changePhonePassword', { input: { password: f.password } });
							clearSession();
							await action.client.clearStore();
							await router.push('/account/sign-in?passwordChanged=1');
						});
					}}
				>
					<Password
						label={translate('New phone password')}
						name="password"
						required
						minLength={6}
						maxLength={30}
						autoComplete="new-password"
					/>
					<Button type="submit" disabled={action.busy}>
						{translate('Change password')}
					</Button>
				</form>
			</section>
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
