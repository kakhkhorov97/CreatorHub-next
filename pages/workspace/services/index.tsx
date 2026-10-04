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
	return (
		<Layout title={'Your services'} area="workspace">
			<Guard creatorOnly>
				<ManagerContent />
			</Guard>
		</Layout>
	);
}

function ManagerContent() {
	const profile = useApi('myCreatorProfile');
	const result = usePaged('getMyServices', {}, !profile.value);
	const action = useAction();
	const [remove, setRemove] = useState<string | null>(null);
	return (
		<>
			<Heading title={'Your services'}>
				<LinkButton href={`/workspace/services/new`}>{'Add service'}</LinkButton>
			</Heading>
			{profile.error && !profile.value ? (
				<Empty title="Create your creator profile first">
					<Link passHref href="/workspace/profile">
						Set up your profile
					</Link>
				</Empty>
			) : (
				<>
					<QueryState loading={profile.loading || result.loading} error={result.error} retry={() => result.refetch()} />
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>{'Service'}</th>
									<th>Status</th>
									<th>Last updated</th>
									<th>Actions</th>
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
												<Link passHref href={`/workspace/services/${item._id}`} className="button secondary">
													Edit
												</Link>
												<Button danger secondary onClick={() => setRemove(item._id)}>
													Delete
												</Button>
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{!result.loading && !result.rows.length && (
						<Empty title={`No services yet`}>Save a draft, then submit it for approval when it is ready.</Empty>
					)}
					<Pager {...result} />
				</>
			)}
			{remove && (
				<Confirm
					title={`Delete this ${'service'}?`}
					busy={action.busy}
					onCancel={() => setRemove(null)}
					onConfirm={() =>
						action.run(async () => {
							await action.mutate('deleteService', { serviceId: remove });
							setRemove(null);
							await result.refetch();
						})
					}
				>
					It will no longer be visible on CreatorHub.
				</Confirm>
			)}
			<Feedback {...action} />
		</>
	);
}
export default Manager;
