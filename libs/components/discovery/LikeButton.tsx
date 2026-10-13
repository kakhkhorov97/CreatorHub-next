import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Heart } from 'phosphor-react';
import { userVar } from '../../../apollo/store';
import { useAction, useApi } from '../../hooks/useApi';
import { Feedback } from '../common/UI';

export default function LikeButton({ projectId, ownerId }: { projectId: string; ownerId?: string }) {
	const { t: translate } = useSiteTranslation('common');

	const user = useReactiveVar(userVar);
	const router = useRouter();
	const action = useAction();
	const count = useApi('getProjectLikeCount', { projectId }, !projectId);
	const mine = useApi('getMyProjectLike', { projectId }, !projectId || !user);
	const sequence = useRef(0);
	const [optimistic, setOptimistic] = useState<{ liked: boolean; count: number } | null>(null);
	useEffect(() => {
		sequence.current++;
		setOptimistic(null);
	}, [projectId, user?._id]);
	const liked = optimistic?.liked ?? (!!user && mine.value === true);
	const own = !!user && ownerId === user._id;
	const unavailable = !!user && (mine.loading || !!mine.error);
	return (
		<div className="like-control">
			<button
				type="button"
				className={`like-button ${liked ? 'liked' : ''}`}
				aria-pressed={liked}
				aria-label={own ? translate('Your project') : liked ? translate('Remove like') : translate('Like project')}
				title={own ? translate('You cannot like your own project') : undefined}
				disabled={action.busy || own || unavailable}
				onClick={() => {
					if (!user) {
						router.push(`/account/sign-in?returnTo=${encodeURIComponent(router.asPath)}`);
						return;
					}
					action.run(async () => {
						const current = ++sequence.current;
						const previous = optimistic;
						setOptimistic({
							liked: !liked,
							count: Math.max(0, (optimistic?.count ?? count.value ?? 0) + (liked ? -1 : 1)),
						});
						try {
							await action.mutate('setProjectLike', { projectId, liked: !liked });
						} catch (error) {
							setOptimistic(previous);
							throw error;
						}
						// Keep the visible state while refreshing cached counters in the background.
						void Promise.all([mine.refetch(), count.refetch()])
							.then(() => {
								if (sequence.current === current) setOptimistic(null);
							})
							.catch(() => {});
					});
				}}
			>
				<Heart size={23} weight={liked ? 'fill' : 'regular'} />
				<span aria-live="polite">{optimistic?.count ?? count.value ?? '—'}</span>
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
					{translate('Retry likes')}
				</button>
			)}
		</div>
	);
}
