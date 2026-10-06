import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useState } from 'react';
import {
	Button,
	Confirm,
	date,
	Empty,
	Feedback,
	Heading,
	LinkButton,
	Pager,
	QueryState,
	Status,
} from '../../../libs/components/common/UI';
import Layout, { Guard } from '../../../libs/components/layout/LayoutBasic';
import { useAction, useApi } from '../../../libs/hooks/useApi';
import { usePaged } from '../../../libs/hooks/usePaged';

function Manager() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Your projects')} area="workspace">
			<Guard creatorOnly>
				<ManagerContent />
			</Guard>
		</Layout>
	);
}

function ManagerContent() {
	const { t: translate } = useSiteTranslation('common');

	const profile = useApi('myCreatorProfile');
	const result = usePaged('getMyProjects', {}, !profile.value);
	const action = useAction();
	const [remove, setRemove] = useState<string | null>(null);
	return (
		<>
			<Heading title={translate('Your projects')}>
				<LinkButton href={`/workspace/projects/new`}>{translate('New project')}</LinkButton>
			</Heading>
			{profile.error && !profile.value ? (
				<Empty title={translate('Create your creator profile first')}>
					<Link passHref href="/workspace/profile">
						{translate('Set up your profile')}
					</Link>
				</Empty>
			) : (
				<>
					<QueryState loading={profile.loading || result.loading} error={result.error} retry={() => result.refetch()} />
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>{translate('Project')}</th>
									<th>{translate('Status')}</th>
									<th>{translate('Last updated')}</th>
									<th>{translate('Actions')}</th>
								</tr>
							</thead>
							<tbody>
								{result.rows.map((item) => (
									<tr key={item._id}>
										<td>{item.title}</td>
										<td>
											<Status value={item.status} />
										</td>
										<td>{date(item.updatedAt)}</td>
										<td>
											<div className="actions">
												<Link passHref href={`/workspace/projects/${item._id}`} className="button secondary">
													{translate('Edit')}
												</Link>
												<Button danger secondary onClick={() => setRemove(item._id)}>
													{translate('Delete')}
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{!result.loading && !result.rows.length && (
						<Empty title={translate('No projects yet')}>
							{translate('Save a draft, then submit it for approval when it is ready.')}
						</Empty>
					)}
					<Pager {...result} />
				</>
			)}
			{remove && (
				<Confirm
					title={translate('Delete this project?')}
					busy={action.busy}
					onCancel={() => setRemove(null)}
					onConfirm={() =>
						action.run(async () => {
							await action.mutate('deleteProject', { projectId: remove });
							setRemove(null);
							await result.refetch();
						})
					}
				>
					{translate('It will no longer be visible on CreatorHub.')}
				</Confirm>
			)}
			<Feedback {...action} />
		</>
	);
}
export default Manager;
