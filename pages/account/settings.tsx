import { useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { userVar } from '../../apollo/store';
import { clearSession } from '../../libs/auth';
import { Button, Confirm, Feedback, Field, Heading, Notice, values } from '../../libs/components/common/UI';
import { AvatarUpload } from '../../libs/components/account/AvatarUpload';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useAction } from '../../libs/hooks/useApi';

function AccountSettings() {
	return (
		<Layout title="Account settings" area="account">
			<Guard>
				<AccountForm />
			</Guard>
		</Layout>
	);
}

function AccountForm() {
	const user = useReactiveVar(userVar)!;
	const action = useAction();
	const router = useRouter();
	const [remove, setRemove] = useState(false);
	const [saved, setSaved] = useState(false);
	return (
		<>
			<Heading title="Account settings" />
			<form
				className="panel editor-form"
				onSubmit={(e) => {
					e.preventDefault();
					const f = values(e.currentTarget);
					action.run(async () => {
						const updated = await action.mutate('updateMe', {
							input: {
								displayName: f.displayName,
								preferredLocale: f.preferredLocale === 'ko' ? 'ko' : 'en',
							},
						});
						userVar(updated);
						setSaved(true);
					});
				}}
			>
				<h2>Your profile</h2>
				<Field
					label="Display name"
					name="displayName"
					defaultValue={user.displayName}
					required
					minLength={2}
					maxLength={60}
				/>
				<AvatarUpload />
				<Field label="Preferred language">
					<select name="preferredLocale" defaultValue={user.preferredLocale}>
						<option value="en">English</option>
						<option value="ko">Korean</option>
					</select>
				</Field>
				<small>This preference is stored with your account. The current interface is in English.</small>
				<Feedback {...action} />
				{saved && <Notice notify>Account updated.</Notice>}
				<div className="account-save-actions">
					<Button type="submit" disabled={action.busy}>
						Save changes
					</Button>
				</div>
			</form>
			<section className="danger-zone">
				<h2>Delete account</h2>
				<p>Your profile will no longer be publicly available and your sessions will be revoked.</p>
				<Button danger secondary onClick={() => setRemove(true)}>
					Delete my account
				</Button>
				{remove && (
					<Confirm
						title="Delete your account?"
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
						This action cannot be undone from the website.
					</Confirm>
				)}
			</section>
		</>
	);
}

export default AccountSettings;
