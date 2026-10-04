import { Button, Empty, Feedback, Heading, Pager, QueryState } from '../libs/components/common/UI';
import { ProjectCard } from '../libs/components/discovery/Cards';
import Layout, { Guard } from '../libs/components/layout/LayoutBasic';
import { useAction } from '../libs/hooks/useApi';
import { usePaged } from '../libs/hooks/usePaged';

function Saved() {
	return (
		<Layout title="Saved projects" area="account">
			<Guard>
				<SavedContent />
			</Guard>
		</Layout>
	);
}

function SavedContent() {
	const result = usePaged('getSavedProjects', {});
	const action = useAction();
	return (
		<>
			<Heading title="Saved projects" />
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			<div className="grid">
				{result.rows.map((row) =>
					row.available && row.project ? (
						<ProjectCard key={row.projectId} project={row.project} saved onChange={() => result.refetch()} />
					) : (
						<section className="panel" key={row.projectId}>
							<h2>Project unavailable</h2>
							<p>This project is no longer publicly available.</p>
							<Button
								secondary
								disabled={action.busy}
								onClick={() =>
									action.run(async () => {
										await action.mutate('setProjectSaved', { projectId: row.projectId, saved: false });
										await result.refetch();
									})
								}
							>
								Remove from saved
							</Button>
						</section>
					),
				)}
			</div>
			{!result.loading && !result.error && !result.rows.length && (
				<Empty title="No saved projects yet">Save work you want to revisit from the explore page.</Empty>
			)}
			<Pager {...result} />
			<Feedback {...action} />
		</>
	);
}

export default Saved;
