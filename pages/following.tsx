import Link from 'next/link';
import { Button, Empty, Feedback, Heading, Pager, Picture, QueryState } from '../libs/components/common/UI';
import Layout, { Guard } from '../libs/components/layout/LayoutBasic';
import { useAction } from '../libs/hooks/useApi';
import { useCreatorDirectory } from '../libs/hooks/useCreatorDirectory';
import { usePaged } from '../libs/hooks/usePaged';

function Following() {
	return (
		<Layout title="Following" area="account">
			<Guard>
				<FollowingContent />
			</Guard>
		</Layout>
	);
}

function FollowingContent() {
	const result = usePaged('getMyFollows', {});
	const creators = useCreatorDirectory(result.rows.map((f) => f.creatorId));
	const action = useAction();
	return (
		<>
			<Heading title="Following" />
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
								<strong>Followed creator</strong>
								<p>The public profile may be unavailable.</p>
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
							Unfollow
						</Button>
					</li>
				))}
			</ul>
			{!result.loading && !result.error && !result.rows.length && (
				<Empty title="You aren’t following anyone yet">Find a creator and follow their work.</Empty>
			)}
			<Pager {...result} />
			<Feedback {...action} />
		</>
	);
}

export default Following;
