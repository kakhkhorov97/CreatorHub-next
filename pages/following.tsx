import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Button, Empty, Feedback, Heading, Pager, Picture, QueryState } from '../libs/components/common/UI';
import Layout, { Guard } from '../libs/components/layout/LayoutBasic';
import { useAction } from '../libs/hooks/useApi';
import { useCreatorDirectory } from '../libs/hooks/useCreatorDirectory';
import { usePaged } from '../libs/hooks/usePaged';

function Following() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Followers & Following')} area="account">
			<Guard>
				<FollowingContent />
			</Guard>
		</Layout>
	);
}

function FollowingContent() {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const tab = router.query.tab === 'followers' ? 'followers' : 'following';
	const setTab = (next: string) =>
		void router.replace({ pathname: '/following', query: { tab: next } }, undefined, { shallow: true, scroll: false });
	const result = usePaged('getMyFollows', {}, tab !== 'following');
	const followers = usePaged('getMyFollowers', {}, tab !== 'followers');
	const creators = useCreatorDirectory(result.rows.map((f) => f.creatorId));
	const action = useAction();
	return (
		<>
			<Heading title={translate('Followers & Following')} />
			<nav className="tabs" aria-label={translate('Followers & Following')}>
				<button
					className={tab === 'following' ? 'active' : ''}
					onClick={() => setTab('following')}
					aria-pressed={tab === 'following'}
				>
					{translate('Following')}
				</button>
				<button
					className={tab === 'followers' ? 'active' : ''}
					onClick={() => setTab('followers')}
					aria-pressed={tab === 'followers'}
				>
					{translate('Followers')}
				</button>
			</nav>
			{tab === 'followers' ? (
				<>
					<QueryState loading={followers.loading} error={followers.error} retry={() => followers.refetch()} />
					<ul className="following-list">
						{followers.rows.map((member) => (
							<li className="following-row" key={member._id}>
								<div className="following-profile">
									<Picture avatar src={member.avatarUrl} alt="" />
									<strong>{member.displayName}</strong>
								</div>
							</li>
						))}
					</ul>
					{!followers.loading && !followers.error && !followers.rows.length && (
						<Empty title={translate('No followers yet')}>
							{translate('Followers will appear here when people follow your creator profile.')}
						</Empty>
					)}
					<Pager {...followers} />
				</>
			) : (
				<>
					<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
					<ul className="following-list">
						{result.rows.map((f) => (
							<li className="following-row" key={f._id}>
								{creators[f.creatorId] ? (
									<Link passHref className="following-profile" href={`/creators/${creators[f.creatorId].slug}`}>
										<Picture avatar src={creators[f.creatorId].identity.avatarUrl} alt="" />
										<div>
											<strong>{creators[f.creatorId].identity.displayName}</strong>
											<p>{creators[f.creatorId].headline}</p>
										</div>
									</Link>
								) : (
									<div className="following-profile">
										<strong>{translate('Followed creator')}</strong>
										<p>{translate('The public profile may be unavailable.')}</p>
									</div>
								)}
								<Button
									danger
									disabled={action.busy}
									onClick={() =>
										action.run(async () => {
											await action.mutate('setCreatorFollow', { creatorId: f.creatorId, following: false });
											await result.refetch();
										})
									}
								>
									{translate('Unfollow')}
								</Button>
							</li>
						))}
					</ul>
					{!result.loading && !result.error && !result.rows.length && (
						<Empty title={translate('You aren’t following anyone yet')}>
							{translate('Find a creator and follow their work.')}
						</Empty>
					)}
					<Pager {...result} />
				</>
			)}
			<Feedback {...action} />
		</>
	);
}

export default Following;
