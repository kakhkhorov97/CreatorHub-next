import { Button, Empty, Feedback, Heading, Pager, QueryState } from '../libs/components/common/UI';
import { CreatorCard } from '../libs/components/discovery/Cards';
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
			<div className="grid">
				{result.rows.map((f) => (
					<section key={f._id}>
						{creators[f.creatorId] ? (
							<CreatorCard creator={creators[f.creatorId]} />
						) : (
							<div className="panel">
								<h2>Followed creator</h2>
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
					</section>
				))}
			</div>
			{!result.loading && !result.error && !result.rows.length && (
				<Empty title="You aren’t following anyone yet">Find a creator and follow their work.</Empty>
			)}
			<Pager {...result} />
			<Feedback {...action} />
		</>
	);
}

export default Following;
