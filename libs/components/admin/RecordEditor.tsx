import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useAction, useApi } from '../../hooks/useApi';
import {
	AdminEntry,
	AdminKind,
	PortfolioMediaInput,
	ProfileStatus,
	ProjectStatus,
	ServiceStatus,
	SocialLinkInput,
	UserStatus,
} from '../../types/creatorhub';
import {
	Button,
	Confirm,
	Feedback,
	Field,
	lines,
	Notice,
	optional,
	QueryState,
	Status,
	TextArea,
	values,
} from '../common/UI';
import { labels, states } from './directoryConfig';

export function Editor({ kind, entry, onClose }: { kind: AdminKind; entry?: AdminEntry; onClose: () => void }) {
	const action = useAction(),
		cats = useApi('adminCategories'),
		cities = useApi('getCities');
	const [creatorFilter, setCreatorFilter] = useState('');
	const creatorList = useApi(
		'adminDirectory',
		{ kind: 'CREATORS', input: { limit: 50, removed: false, search: creatorFilter } },
		!!entry || !['PROJECTS', 'SERVICES'].includes(kind),
	);
	const [record, setRecord] = useState(entry),
		[message, setMessage] = useState(''),
		[pending, setPending] = useState<{ title: string; execute: () => Promise<unknown> } | null>(null);
	const p = record?.project,
		s = record?.service,
		c = record?.creator,
		u = record?.user;
	const [media, setMedia] = useState<PortfolioMediaInput[]>(
		p?.media.map((m) => ({ type: m.type, url: m.url, altText: m.altText, sortOrder: m.sortOrder })) || [],
	);
	const [links, setLinks] = useState<SocialLinkInput[]>(
		c?.socialLinks.map((l) => ({ label: l.label, url: l.url })) || [],
	);
	const [dirty, setDirty] = useState(false);
	const [categoryId, setCategoryId] = useState(p?.categoryId || s?.categoryId || '');
	const [city, setCity] = useState(c?.city || '');

	async function refresh() {
		if (record) {
			const r = await action.client.query({
				query: (await import('../../hooks/useApi')).documents.adminDirectory,
				variables: { kind, input: { id: record._id } },
				fetchPolicy: 'network-only',
			});
			setRecord(r.data.adminDirectory.list[0]);
		}
		setMessage('Changes saved.');
		setDirty(false);
	}

	async function save(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const f = values(e.currentTarget),
			selectedCategories = new FormData(e.currentTarget).getAll('categoryIds') as string[];
		await action.run(async () => {
			if (kind === 'USERS')
				await action.mutate('adminUpdateUser', {
					id: record!._id,
					input: {
						displayName: f.displayName,
						role: f.role as 'USER' | 'CREATOR' | 'ADMIN',
						preferredLocale: f.preferredLocale as 'en' | 'ko',
						avatarUrl: f.avatarUrl !== u?.avatarUrl ? optional(f.avatarUrl) : undefined,
					},
				});
			if (kind === 'CREATORS')
				await action.mutate('adminUpdateCreator', {
					id: record!._id,
					input: {
						slug: f.slug,
						headline: optional(f.headline),
						bio: optional(f.bio),
						city: optional(f.city),
						remoteAvailable: f.remoteAvailable === 'on',
						availability: f.availability as 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE',
						categoryIds: selectedCategories,
						skills: lines(f.skills),
						socialLinks: links,
					},
				});
			if (kind === 'PROJECTS') {
				const input = {
					title: f.title,
					slug: f.slug,
					categoryId: optional(f.categoryId),
					summary: optional(f.summary),
					description: optional(f.description),
					coverImageUrl: f.coverImageUrl !== p?.coverImageUrl ? optional(f.coverImageUrl) : undefined,
					media:
						JSON.stringify(media) ===
						JSON.stringify(
							p?.media.map((m) => ({ type: m.type, url: m.url, altText: m.altText, sortOrder: m.sortOrder })),
						)
							? undefined
							: media.map((m, i) => ({ ...m, sortOrder: i })),
					tags: lines(f.tags),
					externalUrl: optional(f.externalUrl),
				};
				if (record) await action.mutate('adminUpdateProject', { id: record._id, input });
				else {
					await action.mutate('adminCreateProject', { creatorId: f.creatorId, input });
					onClose();
					return;
				}
			}
			if (kind === 'SERVICES') {
				const input = {
					title: f.title,
					categoryId: optional(f.categoryId),
					description: optional(f.description),
					pricingType: f.pricingType as 'STARTING_AT' | 'CUSTOM_QUOTE',
					startingPrice:
						f.pricingType === 'STARTING_AT' && f.startingPrice !== '' ? Number(f.startingPrice) : undefined,
					estimatedDays: f.estimatedDays ? Number(f.estimatedDays) : undefined,
					deliverables: lines(f.deliverables),
				};
				if (record) await action.mutate('adminUpdateService', { id: record._id, input });
				else {
					await action.mutate('adminCreateService', { creatorId: f.creatorId, input });
					onClose();
					return;
				}
			}
			await refresh();
		});
	}

	function transition(status: string) {
		setPending({
			title: `Change status to ${status.toLowerCase()}?`,
			execute: async () => {
				if (kind === 'USERS')
					await action.mutate('adminSetUserStatus', { id: record!._id, status: status as UserStatus });
				if (kind === 'CREATORS')
					await action.mutate('adminUpdateCreator', { id: record!._id, input: {}, status: status as ProfileStatus });
				if (kind === 'PROJECTS')
					await action.mutate('adminUpdateProject', { id: record!._id, input: {}, status: status as ProjectStatus });
				if (kind === 'SERVICES')
					await action.mutate('adminUpdateService', { id: record!._id, input: {}, status: status as ServiceStatus });
				if (kind === 'COMMENTS')
					await action.mutate('moderateProjectComment', { commentId: record!._id, hidden: status === 'HIDDEN' });
				await refresh();
			},
		});
	}
	const allowed =
		kind === 'USERS'
			? states.USERS
			: kind === 'CREATORS'
			? record?.status === 'DRAFT'
				? ['PUBLISHED']
				: ['PUBLISHED', 'HIDDEN']
			: kind === 'PROJECTS'
			? record?.status === 'DRAFT'
				? ['PUBLISHED']
				: ['PUBLISHED', 'ARCHIVED']
			: kind === 'SERVICES'
			? record?.status === 'DRAFT'
				? ['ACTIVE']
				: record?.status === 'ARCHIVED'
				? ['ACTIVE']
				: ['ACTIVE', 'PAUSED', 'ARCHIVED']
			: record?.status === 'DELETED'
			? []
			: ['ACTIVE', 'HIDDEN'];
	return (
		<>
			<Button secondary onClick={onClose}>
				← Back to {labels[kind].toLowerCase()}
			</Button>
			<div className="admin-page-heading">
				<div>
					<h1>{record ? record.title : `New ${kind === 'PROJECTS' ? 'project' : 'service'}`}</h1>
					<p>
						{record
							? `Record ${record._id}`
							: 'Create a draft for an existing creator, then review it before publication.'}
					</p>
				</div>
				{record && <Status value={record.deletedAt ? 'REMOVED' : record.status} />}
			</div>
			<div className="admin-editor-grid">
				<section className="admin-panel">
					<h2>{kind === 'COMMENTS' ? 'Comment details' : 'Details'}</h2>
					{kind === 'COMMENTS' ? (
						<>
							<p className="admin-comment-body">{record?.comment?.content}</p>
							<dl className="admin-detail-list">
								<dt>Author</dt>
								<dd>{record?.ownerName}</dd>
								<dt>Project</dt>
								<dd>
									{record?.projectTitle}{' '}
									<Link passHref href={`/projects/${record?.comment?.projectId}`}>
										View project →
									</Link>
								</dd>
							</dl>
						</>
					) : (
						<form
							onSubmit={save}
							onChange={() => {
								setDirty(true);
								setMessage('');
							}}
							className="admin-edit-form"
						>
							{!record && (
								<>
									<Field
										label="Find creator"
										value={creatorFilter}
										onChange={(e) => setCreatorFilter(e.target.value)}
										placeholder="Search profiles…"
									/>
									<Field label="Creator">
										<select name="creatorId" required>
											<option value="">Select a creator</option>
											{creatorList.value?.map((r) => (
												<option value={r._id} key={r._id}>
													{r.ownerName} · {r.creator?.slug}
												</option>
											))}
										</select>
									</Field>
									<QueryState loading={creatorList.loading} error={creatorList.error} />
								</>
							)}
							{kind === 'USERS' && (
								<>
									<Field
										label="Display name"
										name="displayName"
										required
										minLength={2}
										maxLength={60}
										defaultValue={u?.displayName}
									/>
									<Field
										label="Avatar URL"
										name="avatarUrl"
										maxLength={2048}
										defaultValue={u?.avatarUrl || ''}
										hint="A replacement must use this account's media folder."
									/>
									<div className="form-grid">
										<Field label="Role">
											<select name="role" defaultValue={u?.role}>
												{['USER', 'CREATOR', 'ADMIN'].map((v) => (
													<option key={v}>{v}</option>
												))}
											</select>
										</Field>
										<Field label="Preferred language">
											<select name="preferredLocale" defaultValue={u?.preferredLocale}>
												<option value="en">English</option>
												<option value="ko">Korean</option>
											</select>
										</Field>
									</div>
								</>
							)}
							{kind === 'CREATORS' && (
								<>
									<Field
										label="Profile slug"
										name="slug"
										required
										minLength={3}
										maxLength={80}
										pattern="[a-z0-9]+(-[a-z0-9]+)*"
										defaultValue={c?.slug}
									/>
									<Field label="Headline" name="headline" maxLength={120} defaultValue={c?.headline || ''} />
									<TextArea label="Bio" name="bio" rows={5} maxLength={3000} defaultValue={c?.bio || ''} />
									<div className="form-grid">
										<Field label="City">
											<select name="city" value={city} onChange={(e) => setCity(e.target.value)}>
												<option value="">Select city</option>
												{cities.value?.map((v) => (
													<option key={v.key} value={v.key}>
														{v.nameEn}
													</option>
												))}
											</select>
										</Field>
										<Field label="Availability">
											<select name="availability" defaultValue={c?.availability}>
												{['AVAILABLE', 'BUSY', 'UNAVAILABLE'].map((v) => (
													<option key={v}>{v}</option>
												))}
											</select>
										</Field>
									</div>
									<label className="admin-checkbox">
										<input type="checkbox" name="remoteAvailable" defaultChecked={c?.remoteAvailable} /> Remote
										available
									</label>
									<fieldset className="admin-categories">
										<legend>Categories, up to five</legend>
										{cats.value?.map((cat) => (
											<label key={cat._id}>
												<input
													type="checkbox"
													name="categoryIds"
													value={cat._id}
													defaultChecked={c?.categoryIds.includes(cat._id)}
												/>{' '}
												{cat.name}
												{!cat.isActive ? ' (inactive)' : ''}
											</label>
										))}
									</fieldset>
									<TextArea
										label="Skills, one per line"
										name="skills"
										defaultValue={c?.skills.join('\n')}
										maxLength={1100}
									/>
									<h3>Social links</h3>
									{links.map((l, i) => (
										<div className="admin-media-row" key={i}>
											<Field
												label="Link label"
												required
												maxLength={40}
												value={l.label}
												onChange={(e) => setLinks(links.map((v, n) => (n === i ? { ...v, label: e.target.value } : v)))}
											/>
											<Field
												label="HTTPS URL"
												required
												type="url"
												pattern="https://.*"
												maxLength={2048}
												value={l.url}
												onChange={(e) => setLinks(links.map((v, n) => (n === i ? { ...v, url: e.target.value } : v)))}
											/>
											<Button
												danger
												secondary
												onClick={() => {
													setLinks(links.filter((_, n) => n !== i));
													setDirty(true);
												}}
											>
												Remove link
											</Button>
										</div>
									))}
									<Button
										secondary
										disabled={links.length >= 8}
										onClick={() => {
											setLinks([...links, { label: '', url: '' }]);
											setDirty(true);
										}}
									>
										Add social link
									</Button>
								</>
							)}
							{['PROJECTS', 'SERVICES'].includes(kind) && (
								<>
									<Field label="Title" name="title" required maxLength={150} defaultValue={p?.title || s?.title} />
									{kind === 'PROJECTS' && (
										<>
											<Field
												label="Project slug"
												name="slug"
												required
												minLength={3}
												maxLength={100}
												pattern="[a-z0-9]+(-[a-z0-9]+)*"
												defaultValue={p?.slug}
											/>
											<Field label="Summary" name="summary" maxLength={300} defaultValue={p?.summary || ''} />
										</>
									)}
									<Field label="Category">
										<select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
											<option value="">Select category</option>
											{cats.value?.map((v) => (
												<option key={v._id} value={v._id}>
													{v.name}
													{!v.isActive ? ' (inactive)' : ''}
												</option>
											))}
										</select>
									</Field>
									<TextArea
										label="Description"
										name="description"
										rows={6}
										maxLength={kind === 'PROJECTS' ? 20000 : 10000}
										defaultValue={p?.description || s?.description || ''}
									/>
								</>
							)}
							{kind === 'PROJECTS' && (
								<>
									<Field
										label="Cover image URL"
										name="coverImageUrl"
										maxLength={2048}
										defaultValue={p?.coverImageUrl || ''}
									/>
									<p className="admin-help">
										Existing demo images are retained. New media must use the creator account's storage folder.
									</p>
									<h3>Portfolio media</h3>
									{media.map((m, i) => (
										<div className="admin-media-row" key={i}>
											<Field label="Type">
												<select
													value={m.type}
													onChange={(e) =>
														setMedia(
															media.map((v, n) => (n === i ? { ...v, type: e.target.value as 'IMAGE' | 'VIDEO' } : v)),
														)
													}
												>
													<option>IMAGE</option>
													<option>VIDEO</option>
												</select>
											</Field>
											<Field
												label="Media URL"
												required
												maxLength={2048}
												value={m.url}
												onChange={(e) => setMedia(media.map((v, n) => (n === i ? { ...v, url: e.target.value } : v)))}
											/>
											<Field
												label="Alt text"
												required
												maxLength={300}
												value={m.altText}
												onChange={(e) =>
													setMedia(media.map((v, n) => (n === i ? { ...v, altText: e.target.value } : v)))
												}
											/>
											<Button
												danger
												secondary
												onClick={() => {
													setMedia(media.filter((_, n) => n !== i));
													setDirty(true);
												}}
											>
												Remove media
											</Button>
										</div>
									))}
									<Button
										secondary
										disabled={media.length >= 20}
										onClick={() => {
											setMedia([...media, { type: 'IMAGE', url: '', altText: '', sortOrder: media.length }]);
											setDirty(true);
										}}
									>
										Add media
									</Button>
									<TextArea label="Tags, one per line" name="tags" defaultValue={p?.tags.join('\n')} maxLength={450} />
									<Field
										label="External project URL"
										type="url"
										pattern="https://.*"
										name="externalUrl"
										maxLength={2048}
										defaultValue={p?.externalUrl || ''}
									/>
								</>
							)}
							{kind === 'SERVICES' && (
								<>
									<div className="form-grid">
										<Field label="Pricing">
											<select name="pricingType" defaultValue={s?.pricingType || 'CUSTOM_QUOTE'}>
												<option value="CUSTOM_QUOTE">Custom quote</option>
												<option value="STARTING_AT">Starting at</option>
											</select>
										</Field>
										<Field
											label="Starting price, KRW"
											name="startingPrice"
											type="number"
											min={0}
											max={1000000000}
											defaultValue={s?.startingPrice ?? ''}
										/>
										<Field
											label="Estimated days"
											name="estimatedDays"
											type="number"
											min={1}
											max={365}
											defaultValue={s?.estimatedDays ?? ''}
										/>
									</div>
									<TextArea
										label="Deliverables, one per line"
										name="deliverables"
										rows={5}
										defaultValue={s?.deliverables.join('\n')}
										maxLength={3200}
									/>
								</>
							)}
							{record?.deletedAt && kind !== 'USERS' && (
								<Notice>Restore this record before editing its details.</Notice>
							)}
							<p className="admin-help">Blank optional text fields keep their saved value.</p>
							<Feedback {...action} />
							{message && <Notice notify>{message}</Notice>}
							<div className="actions">
								<Button type="submit" disabled={action.busy || (!!record?.deletedAt && kind !== 'USERS')}>
									{record ? 'Save changes' : 'Create draft'}
								</Button>
								<Button secondary onClick={onClose}>
									Cancel
								</Button>
							</div>
						</form>
					)}
				</section>
				<aside className="admin-panel admin-record-controls">
					<h2>{kind === 'USERS' ? 'Account access' : 'Publication & moderation'}</h2>
					<p>
						{record
							? 'Status changes affect what visitors can see. Removal retains the record for recovery.'
							: 'Save the draft first to manage its publication.'}
					</p>
					{record && (
						<>
							<dl className="admin-detail-list">
								<dt>Current status</dt>
								<dd>
									<Status value={record.deletedAt ? 'REMOVED' : record.status} />
								</dd>
								{record.ownerName && (
									<>
										<dt>Owner</dt>
										<dd>{record.ownerName}</dd>
									</>
								)}
							</dl>
							{dirty && <Notice>Save or cancel your edits before changing the status.</Notice>}
							{!record.deletedAt &&
								allowed
									.filter((v) => v !== record.status)
									.map((v) => (
										<Button
											danger={v === 'DELETED'}
											secondary
											key={v}
											disabled={action.busy || dirty}
											onClick={() => transition(v)}
										>
											{v === 'DELETED'
												? 'Remove account'
												: v === 'ACTIVE'
												? 'Activate / restore'
												: v === 'PUBLISHED'
												? 'Publish'
												: v === 'HIDDEN'
												? 'Hide'
												: v === 'SUSPENDED'
												? 'Suspend'
												: v === 'PAUSED'
												? 'Pause'
												: 'Archive'}
										</Button>
									))}
							{kind === 'USERS' && record.deletedAt && (
								<Button disabled={action.busy || dirty} onClick={() => transition('ACTIVE')}>
									Restore account
								</Button>
							)}
							{['CREATORS', 'PROJECTS', 'SERVICES'].includes(kind) && (
								<Button
									danger={!record.deletedAt}
									secondary={!!record.deletedAt}
									disabled={action.busy || dirty}
									onClick={() =>
										setPending({
											title: record.deletedAt ? 'Restore this record?' : 'Remove this record?',
											execute: async () => {
												await action.mutate('adminSetRemoved', { kind, id: record._id, removed: !record.deletedAt });
												await refresh();
											},
										})
									}
								>
									{record.deletedAt ? 'Restore record' : 'Remove record'}
								</Button>
							)}
							{record.deletedAt && (
								<p className="admin-help">Restored content stays unpublished until you publish or activate it again.</p>
							)}
						</>
					)}
					{pending && (
						<Confirm
							title={pending.title}
							busy={action.busy}
							onCancel={() => setPending(null)}
							onConfirm={() =>
								action.run(async () => {
									await pending.execute();
									setPending(null);
								})
							}
						>
							This change will be saved to CreatorHub. Review the selected record before confirming.
						</Confirm>
					)}
					<Feedback {...action} />
					{message && kind === 'COMMENTS' && <Notice notify>{message}</Notice>}
				</aside>
			</div>
		</>
	);
}
