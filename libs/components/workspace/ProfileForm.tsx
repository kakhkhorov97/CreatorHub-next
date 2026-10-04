import Link from 'next/link';
import { useState } from 'react';
import { userVar } from '../../../apollo/store';
import { documents, useAction, useApi } from '../../hooks/useApi';
import { CreatorAvailability, CreatorProfile, SocialLink } from '../../types/creatorhub';
import { Button, Confirm, Feedback, Field, lines, Notice, optional, Status, TextArea, values } from '../common/UI';
import ReviewStatus from '../review/ReviewStatus';

export function ProfileForm({ profile, refresh }: { profile?: CreatorProfile; refresh: () => Promise<unknown> }) {
	const action = useAction();
	const cats = useApi('categories');
	const cities = useApi('getCities');
	const [city, setCity] = useState(profile?.city || '');
	const [links, setLinks] = useState<SocialLink[]>(profile?.socialLinks || []);
	const [remove, setRemove] = useState(false);
	const [message, setMessage] = useState('');
	return (
		<>
			<form
				className="editor-layout"
				onSubmit={(e) => {
					e.preventDefault();
					const form = e.currentTarget;
					const f = values(form);
					const categoryIds = new FormData(form).getAll('categoryIds') as string[];
					action.run(async () => {
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
					});
				}}
			>
				<section className="panel editor-form">
					<div className="row">
						<h2>Profile details</h2>
						<Status value={profile?.status || 'DRAFT'} />
					</div>
					<Field
						label="Profile address"
						name="slug"
						required
						minLength={3}
						maxLength={80}
						pattern="[a-z0-9]+(-[a-z0-9]+)*"
						defaultValue={profile?.slug}
						hint="Use lowercase letters, numbers, and hyphens."
					/>
					<Field label="Headline" name="headline" maxLength={120} defaultValue={profile?.headline || ''} />
					<TextArea label="Bio" name="bio" maxLength={3000} defaultValue={profile?.bio || ''} />
					<div className="form-grid">
						<Field label="City">
							<select name="city" value={city} onChange={(e) => setCity(e.target.value)}>
								<option value="">Choose a city</option>
								{cities.value?.map((c) => (
									<option key={c.key} value={c.key}>
										{c.nameEn}
									</option>
								))}
							</select>
						</Field>
						<Field label="Availability">
							<select name="availability" defaultValue={profile?.availability || 'AVAILABLE'}>
								{['AVAILABLE', 'BUSY', 'UNAVAILABLE'].map((s) => (
									<option key={s}>{s}</option>
								))}
							</select>
						</Field>
					</div>
					<label className="checkbox">
						<input type="checkbox" name="remoteAvailable" defaultChecked={profile?.remoteAvailable} />
						Remote available
					</label>
					<fieldset>
						<legend>Categories, up to 5</legend>
						<div className="check-grid">
							{cats.value?.map((c) => (
								<label className="checkbox" key={c._id}>
									<input
										type="checkbox"
										name="categoryIds"
										value={c._id}
										defaultChecked={profile?.categoryIds.includes(c._id)}
									/>
									{c.name}
								</label>
							))}
						</div>
					</fieldset>
					<TextArea
						label="Skills, one per line"
						name="skills"
						defaultValue={profile?.skills.join('\n')}
						placeholder="Brand identity&#10;Art direction"
					/>
					<h2>External links</h2>
					{links.map((l, index) => (
						<div className="repeat-row" key={index}>
							<Field
								label="Label"
								required
								maxLength={40}
								value={l.label}
								onChange={(e) => setLinks(links.map((v, i) => (i === index ? { ...v, label: e.target.value } : v)))}
							/>
							<Field
								label="HTTPS URL"
								type="url"
								pattern="https://.*"
								required
								maxLength={2048}
								value={l.url}
								onChange={(e) => setLinks(links.map((v, i) => (i === index ? { ...v, url: e.target.value } : v)))}
							/>
							<Button secondary onClick={() => setLinks(links.filter((_, i) => i !== index))}>
								Remove
							</Button>
						</div>
					))}
					<Button secondary disabled={links.length >= 8} onClick={() => setLinks([...links, { label: '', url: '' }])}>
						Add link
					</Button>
					<Feedback {...action} />
					{message && <Notice>{message}</Notice>}
					<Button type="submit" disabled={action.busy}>
						Save {profile ? 'changes' : 'draft'}
					</Button>
				</section>
				<aside className="panel publishing">
					<ReviewStatus kind="PROFILE" targetId={profile?._id} />
					<h2>Submit your profile</h2>
					<p>A headline, city, and at least one active category are required.</p>
					<p>Save your changes, then submit for admin approval. Explicit sexual content is not allowed.</p>
					{profile && (
						<>
							<Button
								disabled={action.busy || profile.status === 'PUBLISHED'}
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
								Submit for approval
							</Button>
							{profile.status === 'PUBLISHED' && (
								<>
									<Link passHref href={`/creators/${profile.slug}`}>
										View public profile
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
										Hide profile
									</Button>
								</>
							)}
							<Button secondary onClick={() => setRemove(true)}>
								Delete profile
							</Button>
						</>
					)}
				</aside>
			</form>
			{remove && (
				<Confirm
					title="Delete your creator profile?"
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
					Your profile and its work will no longer be publicly visible.
				</Confirm>
			)}
		</>
	);
}
