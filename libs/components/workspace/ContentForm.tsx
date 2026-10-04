import Link from 'next/link';
import { useRouter } from 'next/router';
import { CheckCircle, Circle } from 'phosphor-react';
import { useState } from 'react';
import { useAction, useApi } from '../../hooks/useApi';
import {
	CreatorService,
	MediaType,
	PortfolioMediaInput,
	PortfolioProject,
	PricingType,
	ProjectStatus,
	ServiceStatus,
} from '../../types/creatorhub';
import { Button, Feedback, Field, lines, Notice, optional, Picture, Status, TextArea, values } from '../common/UI';
import ReviewStatus from '../review/ReviewStatus';

export function EditorForm({
	kind,
	item,
	profilePublished,
}: {
	kind: 'project' | 'service';
	item?: PortfolioProject | CreatorService;
	profilePublished: boolean;
}) {
	const router = useRouter();
	const action = useAction();
	const cats = useApi('categories');
	const p = kind === 'project' ? (item as PortfolioProject) : undefined;
	const s = kind === 'service' ? (item as CreatorService) : undefined;
	const [id, setId] = useState(item?._id || '');
	const [categoryId, setCategoryId] = useState(item?.categoryId || '');
	const [status, setStatus] = useState(item?.status || 'DRAFT');
	const [media, setMediaState] = useState<PortfolioMediaInput[]>(
		p?.media.map(({ type, url, altText, sortOrder }) => ({ type, url, altText, sortOrder })) || [],
	);
	const [pricing, setPricing] = useState<PricingType>(s?.pricingType || 'CUSTOM_QUOTE');
	const [message, setMessage] = useState('');
	const [dirty, setDirty] = useState(false);
	const [fields, setFields] = useState<Record<string, string>>({
		description: item?.description || '',
		coverImageUrl: p?.coverImageUrl || '',
		deliverables: s?.deliverables.join('\n') || '',
	});

	function setMedia(next: PortfolioMediaInput[]) {
		setMediaState(next);
		setDirty(true);
	}
	const checks: Array<[string, boolean]> = [
		['Active category selected', !!cats.value?.some((c) => c._id === categoryId && c.isActive)],
		['Description added', !!fields.description?.trim()],
		...(kind === 'project'
			? ([
					['Cover image URL added', !!fields.coverImageUrl?.trim()],
					['At least one media item', media.length > 0 && media.every((m) => !!m.url.trim() && !!m.altText.trim())],
					['Creator profile published', profilePublished],
			  ] as Array<[string, boolean]>)
			: ([['Deliverables added', lines(fields.deliverables || '').length > 0]] as Array<[string, boolean]>)),
	];

	async function save(form: HTMLFormElement) {
		const f = values(form);
		await action.run(async () => {
			setMessage('');
			let result: PortfolioProject | CreatorService;
			if (kind === 'project') {
				const tags = lines(f.tags);
				if (tags.length > 10) throw new Error('Add up to ten tags.');
				const input = {
					title: f.title,
					slug: f.slug,
					categoryId: optional(f.categoryId),
					summary: optional(f.summary),
					description: optional(f.description),
					coverImageUrl: optional(f.coverImageUrl),
					media: media.map((m, i) => ({ ...m, sortOrder: i })),
					tags,
					externalUrl: optional(f.externalUrl),
				};
				result = id
					? await action.mutate('updateProject', { projectId: id, input })
					: await action.mutate('createProject', { input });
			} else {
				const deliverables = lines(f.deliverables);
				if (deliverables.length > 15) throw new Error('Add up to 15 deliverables.');
				const input = {
					title: f.title,
					categoryId: optional(f.categoryId),
					description: optional(f.description),
					pricingType: pricing,
					startingPrice: pricing === 'STARTING_AT' ? Number(f.startingPrice) : undefined,
					estimatedDays: f.estimatedDays ? Number(f.estimatedDays) : undefined,
					deliverables,
				};
				result = id
					? await action.mutate('updateService', { serviceId: id, input })
					: await action.mutate('createService', { input });
			}
			setId(result._id);
			setStatus(result.status);
			setMessage(
				status === 'PUBLISHED' || status === 'ACTIVE' ? 'Changes submitted for admin review.' : 'Draft saved.',
			);
			await action.client.refetchQueries({ include: ['myContentReviews'] });
			setDirty(false);
			if (!id) await router.replace(`/workspace/${kind}s/${result._id}`);
		});
	}

	function transition(next: ProjectStatus | ServiceStatus) {
		action.run(async () => {
			const result =
				kind === 'project'
					? await action.mutate('setProjectStatus', { projectId: id, status: next as ProjectStatus })
					: await action.mutate('setServiceStatus', { serviceId: id, status: next as ServiceStatus });
			setStatus(result.status);
			await action.client.refetchQueries({ include: ['myContentReviews'] });
			setMessage(next === 'PUBLISHED' || next === 'ACTIVE' ? 'Submitted for admin approval.' : 'Status updated.');
		});
	}
	const transitions =
		kind === 'project'
			? status === 'DRAFT'
				? ['PUBLISHED']
				: status === 'PUBLISHED'
				? ['ARCHIVED']
				: ['PUBLISHED']
			: status === 'DRAFT'
			? ['ACTIVE']
			: status === 'ACTIVE'
			? ['PAUSED', 'ARCHIVED']
			: status === 'PAUSED'
			? ['ACTIVE', 'ARCHIVED']
			: ['ACTIVE'];
	return (
		<form
			className="editor-layout"
			onChange={(e) => {
				setFields(values(e.currentTarget));
				setDirty(true);
			}}
			onSubmit={(e) => {
				e.preventDefault();
				save(e.currentTarget);
			}}
		>
			<section className="panel editor-form">
				<div className="row">
					<h2>{kind === 'project' ? 'Project details' : 'Service details'}</h2>
					<Status value={status} />
				</div>
				<div className="form-grid">
					<Field label="Title" name="title" required maxLength={150} defaultValue={item?.title} />
					{kind === 'project' && (
						<Field
							label="Slug"
							name="slug"
							required
							minLength={3}
							maxLength={100}
							pattern="[a-z0-9]+(-[a-z0-9]+)*"
							defaultValue={p?.slug}
						/>
					)}
				</div>
				<Field label="Category">
					<select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
						<option value="">Choose a category</option>
						{cats.value?.map((c) => (
							<option key={c._id} value={c._id}>
								{c.name}
							</option>
						))}
					</select>
				</Field>
				{kind === 'project' && <Field label="Summary" name="summary" maxLength={300} defaultValue={p?.summary || ''} />}
				<TextArea
					label="Description"
					name="description"
					rows={6}
					maxLength={kind === 'project' ? 20000 : 10000}
					defaultValue={item?.description || ''}
				/>
				{kind === 'project' ? (
					<>
						<h2>Project media</h2>
						<Notice>Use media URLs from your account’s storage folder. Direct uploads are not available yet.</Notice>
						<Field
							label="Cover image URL"
							name="coverImageUrl"
							type="url"
							pattern="https://.*"
							maxLength={2048}
							defaultValue={p?.coverImageUrl || ''}
						/>
						<div className="media-editor">
							{media.map((m, index) => (
								<section className="media-item" key={index}>
									{m.type === 'IMAGE' && <Picture src={m.url} alt={m.altText} />}
									<Field label="Type">
										<select
											value={m.type}
											onChange={(e) =>
												setMedia(media.map((v, i) => (i === index ? { ...v, type: e.target.value as MediaType } : v)))
											}
										>
											<option>IMAGE</option>
											<option>VIDEO</option>
										</select>
									</Field>
									<Field
										label="Media URL"
										type="url"
										pattern="https://.*"
										required
										maxLength={2048}
										value={m.url}
										onChange={(e) => setMedia(media.map((v, i) => (i === index ? { ...v, url: e.target.value } : v)))}
									/>
									<Field
										label="Alt text"
										required
										maxLength={300}
										value={m.altText}
										onChange={(e) =>
											setMedia(media.map((v, i) => (i === index ? { ...v, altText: e.target.value } : v)))
										}
									/>
									<div className="actions">
										<Button
											secondary
											disabled={index === 0}
											onClick={() => {
												const next = [...media];
												[next[index - 1], next[index]] = [next[index], next[index - 1]];
												setMedia(next);
											}}
										>
											Move up
										</Button>
										<Button
											secondary
											disabled={index === media.length - 1}
											onClick={() => {
												const next = [...media];
												[next[index + 1], next[index]] = [next[index], next[index + 1]];
												setMedia(next);
											}}
										>
											Move down
										</Button>
										<Button danger secondary onClick={() => setMedia(media.filter((_, i) => i !== index))}>
											Remove
										</Button>
									</div>
								</section>
							))}
						</div>
						<Button
							secondary
							disabled={media.length >= 20}
							onClick={() => setMedia([...media, { type: 'IMAGE', url: '', altText: '', sortOrder: media.length }])}
						>
							Add media URL
						</Button>
						<TextArea label="Tags, one per line" name="tags" defaultValue={p?.tags.join('\n')} />
						<Field
							label="External project URL"
							type="url"
							pattern="https://.*"
							name="externalUrl"
							maxLength={2048}
							defaultValue={p?.externalUrl || ''}
						/>
					</>
				) : (
					<>
						<div className="form-grid">
							<Field label="Pricing">
								<select value={pricing} onChange={(e) => setPricing(e.target.value as PricingType)}>
									<option value="CUSTOM_QUOTE">Custom quote</option>
									<option value="STARTING_AT">Starting at</option>
								</select>
							</Field>
							{pricing === 'STARTING_AT' && (
								<Field
									label="Starting price, KRW"
									name="startingPrice"
									type="number"
									required
									min={0}
									max={1000000000}
									defaultValue={s?.startingPrice ?? ''}
								/>
							)}
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
							rows={6}
							defaultValue={s?.deliverables.join('\n')}
						/>
					</>
				)}
				<Feedback {...action} />
				{message && <Notice notify>{message}</Notice>}
				<Button type="submit" disabled={action.busy}>
					{status === 'PUBLISHED' || status === 'ACTIVE' ? 'Submit changes for approval' : 'Save draft'}
				</Button>
			</section>
			<aside className="panel publishing">
				<ReviewStatus kind={kind === 'project' ? 'PROJECT' : 'SERVICE'} targetId={id} />
				<p>Publication requires admin approval. Explicit sexual content is not allowed.</p>
				<h2>{kind === 'project' ? 'Publishing checklist' : 'Activate your service'}</h2>
				<p>
					{kind === 'project'
						? 'Publishing requires an active category, description, cover image, and at least one media item. Your creator profile must be published.'
						: 'Activation requires an active category, description, and at least one deliverable.'}
				</p>
				<ul className="publishing-checklist">
					{checks.map(([text, complete]) => (
						<li key={text} className={complete ? 'complete' : ''}>
							{complete ? <CheckCircle size={22} weight="fill" /> : <Circle size={22} />}
							<span>
								{text}
								<small>{complete ? 'Complete' : 'Required'}</small>
							</span>
						</li>
					))}
				</ul>
				<p>
					{dirty
						? 'You have unsaved changes. Save before changing the status.'
						: 'Your saved changes will be used when publishing.'}
				</p>
				{id &&
					transitions.map((next) => (
						<Button
							key={next}
							secondary={next === 'ARCHIVED' || next === 'PAUSED'}
							disabled={action.busy || dirty}
							onClick={() => transition(next as ProjectStatus | ServiceStatus)}
						>
							{next === 'PUBLISHED'
								? 'Submit for approval'
								: next === 'ACTIVE'
								? 'Submit for approval'
								: next === 'PAUSED'
								? 'Pause service'
								: 'Archive'}
						</Button>
					))}
				{id && (status === 'PUBLISHED' || status === 'ACTIVE') && (
					<Link passHref href={`/${kind}s/${id}`}>
						View public {kind}
					</Link>
				)}
				<Link passHref href={`/workspace/${kind}s`}>
					Back to {kind}s
				</Link>
			</aside>
		</form>
	);
}
