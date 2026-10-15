import { ArrowLeft } from 'phosphor-react';
import { useTranslation as useSiteTranslation } from 'next-i18next';
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
import ProjectUploader from './ProjectUploader';
import { safeUrl } from '../../utils/format';
import ReviewStatus from '../review/ReviewStatus';
import { FieldErrors, useFormValidation } from '../../hooks/useFormValidation';

export function EditorForm({
	kind,
	item,
	profilePublished,
}: {
	kind: 'project' | 'service';
	item?: PortfolioProject | CreatorService;
	profilePublished: boolean;
}) {
	const { t: translate } = useSiteTranslation('common');
	const validation = useFormValidation();

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
	const [uploading, setUploading] = useState(false);
	const [pricing, setPricing] = useState<PricingType>(s?.pricingType || 'CUSTOM_QUOTE');
	const [message, setMessage] = useState('');
	const [dirty, setDirty] = useState(false);
	const [fields, setFields] = useState<Record<string, string>>({
		description: item?.description || '',
		coverImageUrl: p?.coverImageUrl || '',
		imageUrl: s?.imageUrl || '',
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
		if (uploading) return;
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
					imageUrl: optional(f.imageUrl),
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
			{...validation.form}
			className="editor-layout"
			onChange={(e) => {
				setFields(values(e.currentTarget));
				setDirty(true);
			}}
			onSubmit={(e) => {
				e.preventDefault();
				if (!validation.validate(e.currentTarget)) return;
				save(e.currentTarget);
			}}
		>
			<FieldErrors value={validation.errors}>
				<section className="panel editor-form">
					<div className="row">
						<h2>{kind === 'project' ? translate('Project details') : translate('Service details')}</h2>
						<Status value={status} />
					</div>
					<div className="form-grid">
						<Field label={translate('Title')} name="title" required maxLength={150} defaultValue={item?.title} />
						{kind === 'project' && (
							<Field
								label={translate('Slug')}
								name="slug"
								required
								minLength={3}
								maxLength={100}
								pattern="[a-z0-9]+(-[a-z0-9]+)*"
								defaultValue={p?.slug}
							/>
						)}
					</div>
					<Field label={translate('Category')}>
						<select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
							<option value="">{translate('Choose a category')}</option>
							{cats.value?.map((c) => (
								<option key={c._id} value={c._id}>
									{translate(c.name)}
								</option>
							))}
						</select>
					</Field>
					{kind === 'project' && (
						<Field label={translate('Summary')} name="summary" maxLength={300} defaultValue={p?.summary || ''} />
					)}
					<TextArea
						label={translate('Description')}
						name="description"
						rows={6}
						maxLength={kind === 'project' ? 20000 : 10000}
						defaultValue={item?.description || ''}
					/>
					{kind === 'project' ? (
						<>
							<h2>{translate('Project media')}</h2>
							<ProjectUploader
								cover
								disabled={action.busy || uploading}
								onBusy={setUploading}
								onUploaded={([file]) => {
									setFields((previous) => ({ ...previous, coverImageUrl: file.url }));
									setDirty(true);
								}}
							/>
							<input type="hidden" name="coverImageUrl" value={fields.coverImageUrl || ''} />
							{fields.coverImageUrl && <Picture src={fields.coverImageUrl} alt="Project cover preview" />}
							<ProjectUploader
								remaining={20 - media.length}
								disabled={action.busy || uploading}
								onBusy={setUploading}
								onUploaded={(files) => {
									setMediaState((previous) =>
										[...previous, ...files].map((file, sortOrder) => ({ ...file, sortOrder })),
									);
									setDirty(true);
								}}
							/>
							<div className="media-editor">
								{media.map((m, index) => (
									<section className="media-item" key={index}>
										{m.type === 'IMAGE' && <Picture src={m.url} alt={m.altText} />}
										{m.type === 'VIDEO' && safeUrl(m.url) && <video src={safeUrl(m.url)} controls preload="metadata" />}
										<Field label={translate('Type')}>
											<select
												value={m.type}
												onChange={(e) =>
													setMedia(media.map((v, i) => (i === index ? { ...v, type: e.target.value as MediaType } : v)))
												}
											>
												<option value="IMAGE">{translate('IMAGE')}</option>
												<option value="VIDEO">{translate('VIDEO')}</option>
											</select>
										</Field>
										<Field
											label={translate('Media URL')}
											type="url"
											required
											maxLength={2048}
											value={m.url}
											onChange={(e) => setMedia(media.map((v, i) => (i === index ? { ...v, url: e.target.value } : v)))}
										/>
										<Field
											label={translate('Alt text')}
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
												disabled={uploading || index === 0}
												onClick={() => {
													const next = [...media];
													[next[index - 1], next[index]] = [next[index], next[index - 1]];
													setMedia(next);
												}}
											>
												{translate('Move up')}
											</Button>
											<Button
												secondary
												disabled={uploading || index === media.length - 1}
												onClick={() => {
													const next = [...media];
													[next[index + 1], next[index]] = [next[index], next[index + 1]];
													setMedia(next);
												}}
											>
												{translate('Move down')}
											</Button>
											<Button
												danger
												secondary
												disabled={uploading}
												onClick={() => setMedia(media.filter((_, i) => i !== index))}
											>
												{translate('Remove')}
											</Button>
										</div>
									</section>
								))}
							</div>
							<Button
								secondary
								disabled={uploading || media.length >= 20}
								onClick={() => setMedia([...media, { type: 'IMAGE', url: '', altText: '', sortOrder: media.length }])}
							>
								{translate('Add media URL')}
							</Button>
							<TextArea label={translate('Tags, one per line')} name="tags" defaultValue={p?.tags.join('\n')} />
							<Field
								label={translate('External project URL')}
								type="url"
								pattern="https://.*"
								name="externalUrl"
								maxLength={2048}
								defaultValue={p?.externalUrl || ''}
							/>
						</>
					) : (
						<>
							<h2>{translate('Service image')}</h2>
							<p className="muted">
								{translate('Optional. Without one, your newest published project cover is shown instead.')}
							</p>
							<ProjectUploader
								cover
								target="service"
								disabled={action.busy || uploading}
								onBusy={setUploading}
								onUploaded={([file]) => {
									setFields((previous) => ({ ...previous, imageUrl: file.url }));
									setDirty(true);
								}}
							/>
							<input type="hidden" name="imageUrl" value={fields.imageUrl || ''} />
							{fields.imageUrl && <Picture src={fields.imageUrl} alt={translate('Service image preview')} />}
							<div className="form-grid">
								<Field label={translate('Pricing')}>
									<select value={pricing} onChange={(e) => setPricing(e.target.value as PricingType)}>
										<option value="CUSTOM_QUOTE">{translate('Custom quote')}</option>
										<option value="STARTING_AT">{translate('Starting at')}</option>
									</select>
								</Field>
								{pricing === 'STARTING_AT' && (
									<Field
										label={translate('Starting price, KRW')}
										name="startingPrice"
										type="number"
										required
										min={0}
										max={1000000000}
										defaultValue={s?.startingPrice ?? ''}
									/>
								)}
								<Field
									label={translate('Estimated days')}
									name="estimatedDays"
									type="number"
									min={1}
									max={365}
									defaultValue={s?.estimatedDays ?? ''}
								/>
							</div>
							<TextArea
								label={translate('Deliverables, one per line')}
								name="deliverables"
								rows={6}
								defaultValue={s?.deliverables.join('\n')}
							/>
						</>
					)}
					<Feedback {...action} />
					{message && <Notice notify>{message}</Notice>}
					<Button
						type="submit"
						loading={action.busy}
						loadingLabel={translate('Saving…')}
						disabled={action.busy || uploading}
					>
						{status === 'PUBLISHED' || status === 'ACTIVE'
							? translate('Submit changes for approval')
							: translate('Save draft')}
					</Button>
				</section>
				<aside className="panel publishing">
					<ReviewStatus kind={kind === 'project' ? 'PROJECT' : 'SERVICE'} targetId={id} />
					<p>{translate('Publication requires admin approval. Explicit sexual content is not allowed.')}</p>
					<h2>{kind === 'project' ? translate('Publishing checklist') : translate('Activate your service')}</h2>
					<p>
						{kind === 'project'
							? translate(
									'Publishing requires an active category, description, cover image, and at least one media item. Your creator profile must be published.',
							  )
							: translate('Activation requires an active category, description, and at least one deliverable.')}
					</p>
					<ul className="publishing-checklist">
						{checks.map(([text, complete]) => (
							<li key={translate(text)} className={complete ? 'complete' : ''}>
								{complete ? <CheckCircle size={22} weight="fill" /> : <Circle size={22} />}
								<span>
									{translate(text)}
									<small>{complete ? translate('Complete') : translate('Required')}</small>
								</span>
							</li>
						))}
					</ul>
					<p>
						{dirty
							? translate('You have unsaved changes. Save before changing the status.')
							: translate('Your saved changes will be used when publishing.')}
					</p>
					{id &&
						transitions.map((next) => (
							<Button
								key={next}
								secondary={next === 'ARCHIVED' || next === 'PAUSED'}
								disabled={action.busy || uploading || dirty}
								onClick={() => transition(next as ProjectStatus | ServiceStatus)}
							>
								{next === 'PUBLISHED'
									? translate('Submit for approval')
									: next === 'ACTIVE'
									? translate('Submit for approval')
									: next === 'PAUSED'
									? translate('Pause service')
									: translate('Archive')}
							</Button>
						))}
					{id && (status === 'PUBLISHED' || status === 'ACTIVE') && (
						<Link passHref href={`/${kind}s/${id}`}>
							{translate('View public {{kind}}', { kind: translate(kind) })}
						</Link>
					)}
					<Link
						passHref
						href={`/workspace/${kind}s`}
						className="back-link"
						aria-label={translate('Back to {{kind}}', {
							kind: translate(kind === 'project' ? 'Projects' : 'Services'),
						})}
						title={translate('Back to {{kind}}', { kind: translate(kind === 'project' ? 'Projects' : 'Services') })}
					>
						<ArrowLeft size={22} aria-hidden />
					</Link>
				</aside>
			</FieldErrors>
		</form>
	);
}
