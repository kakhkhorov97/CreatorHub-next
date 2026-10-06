import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useState } from 'react';
import { userVar } from '../../../apollo/store';
import { documents, useAction, useApi } from '../../hooks/useApi';
import { CreatorAvailability, CreatorProfile, SocialLink } from '../../types/creatorhub';
import { Button, Confirm, Feedback, Field, lines, Notice, optional, Status, TextArea, values } from '../common/UI';
import ReviewStatus from '../review/ReviewStatus';

export function ProfileForm({ profile, refresh }: { profile?: CreatorProfile; refresh: () => Promise<unknown> }) {
	const { t: translate } = useSiteTranslation('common');

	const action = useAction();
	const cats = useApi('categories');
	const cities = useApi('getCities');
	const [city, setCity] = useState(profile?.city || '');
	const [links, setLinks] = useState<SocialLink[]>(profile?.socialLinks || []);
	const [remove, setRemove] = useState(false);
	const [message, setMessage] = useState('');
	const [dirty, setDirty] = useState(false);
	return (
		<>
			<form
				className="editor-layout"
				onChange={() => setDirty(true)}
				onSubmit={(e) => {
					e.preventDefault();
					const form = e.currentTarget;
					const f = values(form);
					const categoryIds = new FormData(form).getAll('categoryIds') as string[];
					action.run(async () => {
						setMessage('');
						if (categoryIds.length > 5) throw new Error('Choose up to five categories.');
						const input = {
							slug: f.slug,
							headline: optional(f.headline),
							bio: optional(f.bio),
							city: optional(f.city),
							remoteAvailable: !!f.remoteAvailable,
							availability: f.availability as CreatorAvailability,
							categoryIds,
							skills: lines(f.skills),
							socialLinks: links,
						};
						if (input.skills.length > 20) throw new Error('Add up to 20 skills.');
						if (profile) await action.mutate('updateCreatorProfile', { input });
						else await action.mutate('createCreatorProfile', { input });
						setMessage(
							profile?.status === 'PUBLISHED' ? 'Changes submitted for admin review.' : 'Profile draft saved.',
						);
						await action.client.refetchQueries({ include: ['myContentReviews'] });
						await refresh();
						setDirty(false);
					});
				}}
			>
				<section className="panel editor-form">
					<div className="row">
						<h2>{translate('Profile details')}</h2>
						<Status value={profile?.status || 'DRAFT'} />
					</div>
					<Field
						label={translate('Profile address')}
						name="slug"
						required
						minLength={3}
						maxLength={80}
						pattern="[a-z0-9]+(-[a-z0-9]+)*"
						defaultValue={profile?.slug}
						hint={translate('Use lowercase letters, numbers, and hyphens.')}
					/>
					<Field label={translate('Headline')} name="headline" maxLength={120} defaultValue={profile?.headline || ''} />
					<TextArea label={translate('Bio')} name="bio" maxLength={3000} defaultValue={profile?.bio || ''} />
					<div className="form-grid">
						<Field label={translate('City')}>
							<select name="city" value={city} onChange={(e) => setCity(e.target.value)}>
								<option value="">{translate('Choose a city')}</option>
								{cities.value?.map((c) => (
									<option key={c.key} value={c.key}>
										{c.nameEn}
									</option>
								))}
							</select>
						</Field>
						<Field label={translate('Availability')}>
							<select name="availability" defaultValue={profile?.availability || 'AVAILABLE'}>
								{['AVAILABLE', 'BUSY', 'UNAVAILABLE'].map((s) => (
									<option key={s}>{s}</option>
								))}
							</select>
						</Field>
					</div>
					<label className="checkbox">
						<input type="checkbox" name="remoteAvailable" defaultChecked={profile?.remoteAvailable} />
						{translate('Remote available')}
					</label>
					<fieldset>
						<legend>{translate('Categories, up to 5')}</legend>
						<div className="check-grid">
							{cats.value?.map((c) => (
								<label className="checkbox" key={c._id}>
									<input
										type="checkbox"
										name="categoryIds"
										value={c._id}
										defaultChecked={profile?.categoryIds.includes(c._id)}
									/>
									{translate(c.name)}
								</label>
							))}
						</div>
					</fieldset>
					<TextArea
						label={translate('Skills, one per line')}
						name="skills"
						defaultValue={profile?.skills.join('\n')}
						placeholder={translate('Brand identity\nArt direction')}
					/>
					<h2>{translate('External links')}</h2>
					{links.map((l, index) => (
						<div className="repeat-row" key={index}>
							<Field
								label={translate('Label')}
								required
								maxLength={40}
								value={l.label}
								onChange={(e) => setLinks(links.map((v, i) => (i === index ? { ...v, label: e.target.value } : v)))}
							/>
							<Field
								label={translate('HTTPS URL')}
								type="url"
								pattern="https://.*"
								required
								maxLength={2048}
								value={l.url}
								onChange={(e) => setLinks(links.map((v, i) => (i === index ? { ...v, url: e.target.value } : v)))}
							/>
							<Button danger secondary onClick={() => setLinks(links.filter((_, i) => i !== index))}>
								{translate('Remove')}
							</Button>
						</div>
					))}
					<Button secondary disabled={links.length >= 8} onClick={() => setLinks([...links, { label: '', url: '' }])}>
						{translate('Add link')}
					</Button>
					<Feedback {...action} />
					{message && <Notice notify>{message}</Notice>}
					<Button type="submit" disabled={action.busy}>
						{profile?.status === 'PUBLISHED' ? translate('Submit changes for approval') : translate('Save draft')}
					</Button>
				</section>
				<aside className="panel publishing">
					<ReviewStatus kind="PROFILE" targetId={profile?._id} />
					<h2>{translate('Submit your profile')}</h2>
					<p>{translate('A headline, city, and at least one active category are required.')}</p>
					<p>
						{profile?.status === 'PUBLISHED'
							? translate('Submit changes for approval to update your public profile.')
							: translate('Save your changes, then submit for admin approval.')}{' '}
						{translate('Explicit sexual content is not allowed.')}
					</p>
					{profile && (
						<>
							<Button
								disabled={action.busy || dirty || profile.status === 'PUBLISHED'}
								onClick={() =>
									action.run(async () => {
										await action.mutate('setCreatorProfileStatus', { status: 'PUBLISHED' });
										const me = await action.client.query({ query: documents.me, fetchPolicy: 'network-only' });
										userVar(me.data.me);
										await refresh();
										await action.client.refetchQueries({ include: ['myContentReviews'] });
										setMessage('Profile submitted for admin approval.');
									})
								}
							>
								{translate('Submit for approval')}
							</Button>
							{profile.status === 'PUBLISHED' && (
								<>
									<Link passHref href={`/creators/${profile.slug}`}>
										{translate('View public profile')}
									</Link>
									<Button
										secondary
										disabled={action.busy}
										onClick={() =>
											action.run(async () => {
												await action.mutate('setCreatorProfileStatus', { status: 'HIDDEN' });
												await refresh();
											})
										}
									>
										{translate('Hide profile')}
									</Button>
								</>
							)}
							<Button danger secondary onClick={() => setRemove(true)}>
								{translate('Delete profile')}
							</Button>
						</>
					)}
				</aside>
			</form>
			{remove && (
				<Confirm
					title={translate('Delete your creator profile?')}
					busy={action.busy}
					onCancel={() => setRemove(false)}
					onConfirm={() =>
						action.run(async () => {
							await action.mutate('deleteCreatorProfile');
							setRemove(false);
							await refresh();
						})
					}
				>
					{translate('Your profile and its work will no longer be publicly visible.')}
				</Confirm>
			)}
		</>
	);
}
