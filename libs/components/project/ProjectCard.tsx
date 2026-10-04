import { useCardNavigation } from '../../hooks/useCardNavigation';
import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BookmarkSimple } from 'phosphor-react';
import { useState } from 'react';
import { userVar } from '../../../apollo/store';
import { useAction } from '../../hooks/useApi';
import { CreatorProfile, PortfolioProject } from '../../types/creatorhub';
import { Button, Feedback, label, Picture } from '../common/UI';
import LikeButton from '../discovery/LikeButton';

export function ProjectCard({
	project,
	creator,
	saved = false,
	onChange,
}: {
	project: PortfolioProject;
	creator?: CreatorProfile;
	saved?: boolean;
	onChange?: () => unknown;
}) {
	const [isSaved, setSaved] = useState(saved);
	const action = useAction();
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const openCard = useCardNavigation(`/projects/${project._id}`);
	return (
		<article className="project-card" onClick={openCard}>
			<Link passHref href={`/projects/${project._id}`} className="cover-link">
				<Picture src={project.coverImageUrl} alt={project.title} />
			</Link>
			<div className="card-caption">
				<div>
					<Link passHref href={`/projects/${project._id}`} className="card-title">
						{project.title}
					</Link>
					{creator ? (
						<Link passHref href={`/creators/${creator.slug}`} className="creator-line">
							<Picture avatar src={creator.identity.avatarUrl} alt="" />
							<span>
								{creator.identity.displayName}
								<small>
									{project.tags.slice(0, 2).join(' · ')}
									{creator.city ? ` · ${label(creator.city)}` : ''}
								</small>
							</span>
						</Link>
					) : (
						<p className="muted">{project.tags.slice(0, 3).join(' · ') || project.summary || 'Portfolio project'}</p>
					)}
				</div>
				<Button
					secondary
					danger={isSaved}
					className="icon-button"
					aria-label={isSaved ? `Remove ${project.title} from saved projects` : `Save ${project.title}`}
					disabled={action.busy}
					onClick={() => {
						if (!user) {
							router.push(`/account/sign-in?returnTo=${encodeURIComponent(router.asPath)}`);
							return;
						}
						action.run(async () => {
							await action.mutate('setProjectSaved', { projectId: project._id, saved: !isSaved });
							setSaved(!isSaved);
							onChange?.();
						});
					}}
				>
					<BookmarkSimple size={21} weight={isSaved ? 'fill' : 'regular'} />
				</Button>
			</div>
			<div className="project-reactions">
				<LikeButton projectId={project._id} ownerId={creator?.userId} />
			</div>
			<Feedback error={action.error} />
		</article>
	);
}
