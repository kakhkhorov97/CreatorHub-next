import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowUpRight } from 'phosphor-react';
import { userVar } from '../../apollo/store';
import { Button, Feedback, Heading, LinkButton, Picture, QueryState, safeUrl } from '../../libs/components/common/UI';
import LikeButton from '../../libs/components/discovery/LikeButton';
import Layout from '../../libs/components/layout/LayoutBasic';
import { Comments } from '../../libs/components/project/Comments';
import { useAction, useApi } from '../../libs/hooks/useApi';
import { useCreatorDirectory } from '../../libs/hooks/useCreatorDirectory';
import { useMembership } from '../../libs/hooks/useMembership';

function ProjectDetail() {
	const router = useRouter();
	const id = String(router.query.id || '');
	const result = useApi('getProject', { projectId: id }, !id);
	const p = result.value;
	const creators = useCreatorDirectory(p ? [p.creatorId] : []);
	const creator = p && creators[p.creatorId];
	const user = useReactiveVar(userVar);
	const action = useAction();
	const saved = useMembership('saved', id);

	function engage(operation: 'setProjectSaved', state: boolean) {
		if (!user) {
			router.push(`/account/sign-in?returnTo=/projects/${id}`);
			return;
		}
		action.run(async () => {
			await action.mutate(operation, { projectId: id, saved: state });
			saved.setActive(state);
		});
	}
	return (
		<Layout title={p?.title || 'Project'}>
			<Link passHref href="/" className="back-link">
				Back to explore
			</Link>
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			{p && (
				<>
					<Heading title={p.title}>
						<div className="actions">
							<Button
								danger={saved.active}
								secondary
								disabled={action.busy || saved.loading}
								onClick={() => engage('setProjectSaved', !saved.active)}
							>
								{saved.active ? 'Remove from saved' : 'Save project'}
							</Button>
						</div>
					</Heading>
					{creator && (
						<Link passHref className="creator-line" href={`/creators/${creator.slug}`}>
							<Picture avatar src={creator.identity.avatarUrl} />
							{creator.identity.displayName}
						</Link>
					)}
					<div className="detail-layout">
						<section>
							<div className="project-hero">
								<Picture src={p.coverImageUrl} alt={p.title} />
							</div>
							<p className="lead">{p.summary}</p>
							<div className="prose">
								<h2>About the project</h2>
								<p>{p.description}</p>
							</div>
							<div className="project-media">
								{p.media
									.slice()
									.sort((a, b) => a.sortOrder - b.sortOrder)
									.map((m) =>
										m.type === 'VIDEO' && safeUrl(m.url) ? (
											<video key={m.url} controls preload="metadata" aria-label={m.altText} src={m.url} />
										) : (
											<Picture key={m.url} src={m.url} alt={m.altText} />
										),
									)}
							</div>
							<Comments projectId={id} />
						</section>
						<aside className="detail-sidebar">
							<h2>Project details</h2>
							<div className="tags">
								{p.tags.map((t) => (
									<span key={t}>{t}</span>
								))}
							</div>
							<LikeButton projectId={id} ownerId={creator?.userId} />
							<Feedback {...action} />
							{safeUrl(p.externalUrl) && (
								<a className="external-link" href={p.externalUrl!} target="_blank" rel="noreferrer">
									Visit project
									<ArrowUpRight />
								</a>
							)}
							<LinkButton href={`/inquiries/new?creatorId=${p.creatorId}`}>Send inquiry</LinkButton>
						</aside>
					</div>
				</>
			)}
		</Layout>
	);
}

export default ProjectDetail;
