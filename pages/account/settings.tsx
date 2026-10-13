import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { userVar } from '../../apollo/store';
import { clearSession } from '../../libs/auth';
import { Button, Confirm, Feedback, Field, Heading, Notice, values } from '../../libs/components/common/UI';
import AccountSecurity from '../../libs/components/account/AccountSecurity';
import { AvatarUpload } from '../../libs/components/account/AvatarUpload';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useAction } from '../../libs/hooks/useApi';

function AccountSettings() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Account settings')} area="account">
			<Guard>
				<AccountForm />
			</Guard>
		</Layout>
	);
}

function AccountForm() {
	const { t: translate } = useSiteTranslation('common');

	const user = useReactiveVar(userVar)!;
	const action = useAction();
	const router = useRouter();
	const [remove, setRemove] = useState(false);
	const [saved, setSaved] = useState(false);
	return (
		<>
			<div className="account-settings-content">
				<Heading title={translate('Account settings')} />
				<form
					className="panel editor-form"
					onSubmit={(e) => {
						e.preventDefault();
						const f = values(e.currentTarget);
						action.run(async () => {
							const updated = await action.mutate('updateMe', {
								input: {
									displayName: f.displayName,
									preferredLocale: f.preferredLocale === 'ko' ? 'ko' : f.preferredLocale === 'uz' ? 'uz' : 'en',
								},
							});
							userVar(updated);
							setSaved(true);
							await router.push(router.asPath, router.asPath, { locale: updated.preferredLocale, scroll: false });
							document.cookie = `NEXT_LOCALE=${updated.preferredLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
						});
					}}
				>
					<h2>{translate('Your profile')}</h2>
					<Field
						label={translate('Display name')}
						name="displayName"
						defaultValue={user.displayName}
						required
						minLength={2}
						maxLength={60}
					/>
					<AvatarUpload />
					<Field label={translate('Preferred language')}>
						<select name="preferredLocale" defaultValue={user.preferredLocale}>
							<option value="uz">{translate('Uzbek')}</option>
							<option value="en">{translate('English')}</option>
							<option value="ko">{translate('Korean')}</option>
						</select>
					</Field>
					<small>{translate('Your language preference is saved with your account.')}</small>
					<Feedback {...action} />
					{saved && <Notice notify>{translate('Account updated.')}</Notice>}
					<div className="account-save-actions">
						<Button type="submit" disabled={action.busy} loading={action.busy} loadingLabel={translate('Saving…')}>
							{translate('Save changes')}
						</Button>
					</div>
				</form>
				<AccountSecurity />
				<details className="danger-zone account-delete-section">
					<summary>{translate('Delete account')}</summary>
					<p>{translate('Your profile will no longer be publicly available and your sessions will be revoked.')}</p>
					<Button danger secondary onClick={() => setRemove(true)}>
						{translate('Delete my account')}
					</Button>
					{remove && (
						<Confirm
							title={translate('Delete your account?')}
							busy={action.busy}
							onCancel={() => setRemove(false)}
							onConfirm={() =>
								action.run(async () => {
									await action.mutate('deleteMyAccount');
									clearSession();
									await action.client.clearStore();
									await router.push('/');
								})
							}
						>
							{translate('This action cannot be undone from the website.')}
						</Confirm>
					)}
				</details>
			</div>
		</>
	);
}

export default AccountSettings;
