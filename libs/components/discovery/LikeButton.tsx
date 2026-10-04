import { useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { Heart } from 'phosphor-react';
import { userVar } from '../../../apollo/store';
import { useAction, useApi } from '../../hooks/useApi';
import { Feedback } from '../common/UI';

export default function LikeButton({ projectId, ownerId }: { projectId: string; ownerId?: string }) {
	const user = useReactiveVar(userVar);
	const router = useRouter();
	const action = useAction();
	const count = useApi('getProjectLikeCount', { projectId }, !projectId);
	const mine = useApi('getMyProjectLike', { projectId }, !projectId || !user);
	const liked = !!user && mine.value === true;
	const own = !!user && ownerId === user._id;
	const unavailable = !!user && (mine.loading || !!mine.error);
	return (
		<div className="like-control">
			<button
				type="button"
				className={`like-button ${liked ? 'liked' : ''}`}
				aria-pressed={liked}
				aria-label={own ? 'Your project' : liked ? 'Remove like' : 'Like project'}
				title={own ? 'You cannot like your own project' : undefined}
				disabled={action.busy || own || unavailable}
				onClick={() => {
					if (!user) {
						router.push(`/account/sign-in?returnTo=${encodeURIComponent(router.asPath)}`);
						return;
					}
					action.run(async () => {
						await action.mutate('setProjectLike', { projectId, liked: !liked });
						await Promise.all([mine.refetch(), count.refetch()]);
					});
				}}
			>
				<Heart size={23} weight={liked ? 'fill' : 'regular'} />
				<span aria-live="polite">{count.value ?? '—'}</span>
			</button>
			<Feedback error={action.error} />
			{(mine.error || count.error) && (
				<button
					className="like-retry"
					type="button"
					onClick={() => {
						count.refetch();
						if (user) mine.refetch();
					}}
				>
					Retry likes
				</button>
			)}
		</div>
	);
}
