import { useTranslation as useSiteTranslation } from 'next-i18next';
import { MagnifyingGlass, Plus } from 'phosphor-react';
import { FormEvent, useState } from 'react';
import { useApi, documents, unwrap } from '../../hooks/useApi';
import { useApolloClient } from '@apollo/client';
import { usePageAdvance } from '../../hooks/usePageAdvance';
import { AdminDirectoryInput, AdminEntry, AdminKind } from '../../types/creatorhub';
import { Button, Field, optional, Picture, QueryState, Status, values } from '../common/UI';
import AdminLayout from './AdminLayout';
import { labels, states } from './directoryConfig';
import { Editor } from './RecordEditor';

export function Management({ kind }: { kind: AdminKind }) {
	return (
		<AdminLayout title={labels[kind]}>
			<Directory kind={kind} />
		</AdminLayout>
	);
}

export function Directory({ kind }: { kind: AdminKind }) {
	const { t: translate } = useSiteTranslation('common');

	const [filter, setFilter] = useState<AdminDirectoryInput>({ page: 1, limit: 20 });
	const result = useApi('adminDirectory', { kind, input: filter });
	const [selected, setSelected] = useState<AdminEntry | 'new' | null>(null);
	const total = result.data?.adminDirectory.metaCounter[0]?.total ?? 0;
	const page = filter.page || 1;
	const client = useApolloClient();
	const pagination = usePageAdvance(JSON.stringify([kind, filter]), async () => {
		const response = await client.query({
			query: documents.adminDirectory,
			variables: { kind, input: { ...filter, page: page + 1 } },
			fetchPolicy: 'network-only',
		});
		const rows = unwrap(response.data.adminDirectory);
		if (!Array.isArray(rows)) throw new Error('Invalid page response');
		return rows.length > 0;
	}, () => setFilter({ ...filter, page: page + 1 }));
	if (selected)
		return (
			<Editor
				key={selected === 'new' ? 'new' : selected._id}
				kind={kind}
				entry={selected === 'new' ? undefined : selected}
				onClose={() => {
					setSelected(null);
					result.refetch();
				}}
			/>
		);

	function search(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const f = values(e.currentTarget);
		setFilter({
			page: 1,
			limit: 20,
			search: optional(f.search),
			status: optional(f.status),
			role: kind === 'USERS' ? (optional(f.role) as AdminDirectoryInput['role']) : undefined,
			removed: f.removed === 'all' ? undefined : f.removed === 'yes',
		});
	}
	return (
		<>
			<div className="admin-page-heading">
				<div>
					<h1>{labels[kind]}</h1>
					<p>
						{kind === 'USERS'
							? translate('Manage accounts, roles and access.')
							: kind === 'COMMENTS'
							? translate('Review project conversations and moderate public comments.')
							: `Manage every ${kind.toLowerCase().slice(0, -1)}, including unpublished work.`}
					</p>
				</div>
				{['PROJECTS', 'SERVICES'].includes(kind) && (
					<Button onClick={() => setSelected('new')}>
						<Plus size={18} /> {translate('New')} {kind === 'PROJECTS' ? translate('project') : translate('service')}
					</Button>
				)}
			</div>
			<section className="admin-panel">
				<form className="admin-filters" onSubmit={search}>
					<Field
						label={translate('Search')}
						name="search"
						placeholder={
							kind === 'USERS'
								? translate('Search names…')
								: kind === 'CREATORS'
								? translate('Search profile, city…')
								: translate('Search content…')
						}
						maxLength={100}
					/>
					<Field label={translate('Status')}>
						<select name="status">
							<option value="">{translate('All statuses')}</option>
							{states[kind].map((s) => (
								<option key={s} value={s}>
									{s.toLowerCase()}
								</option>
							))}
						</select>
					</Field>
					{kind === 'USERS' && (
						<Field label={translate('Role')}>
							<select name="role">
								<option value="">{translate('All roles')}</option>
								{['USER', 'CREATOR', 'ADMIN'].map((s) => (
									<option key={s}>{s}</option>
								))}
							</select>
						</Field>
					)}
					<Field label={translate('Records')}>
						<select name="removed" defaultValue="all">
							<option value="all">{translate('All records')}</option>
							<option value="no">{translate('Retained')}</option>
							<option value="yes">{translate('Removed')}</option>
						</select>
					</Field>
					<Button type="submit" secondary>
						<MagnifyingGlass size={18} /> {translate('Search')}
					</Button>
				</form>
				<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
				<p className="admin-table-hint">{translate('Scroll the table sideways to see all controls.')}</p>
				<div className="admin-table-scroll">
					<table className="admin-table">
						<thead>
							<tr>
								<th>
									{kind === 'USERS'
										? translate('Account')
										: kind === 'COMMENTS'
										? translate('Comment')
										: translate('Name')}
								</th>
								<th>
									{kind === 'USERS'
										? translate('Role')
										: kind === 'COMMENTS'
										? translate('Project')
										: translate('Creator')}
								</th>
								<th>{translate('Status')}</th>
								<th>{translate('Updated')}</th>
								<th>
									<span className="sr-only">{translate('Actions')}</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{result.value?.map((row) => (
								<tr key={row._id}>
									<td>
										<div className="admin-record-name">
											{kind === 'USERS' && <Picture src={row.user?.avatarUrl} avatar alt="" />}
											{kind === 'PROJECTS' && <Picture src={row.project?.coverImageUrl} alt="" />}
											<div>
												<strong>{row.title}</strong>
												<small>
													{kind === 'CREATORS'
														? row.creator?.slug
														: kind === 'USERS'
														? `ID ${row._id.slice(-8)}`
														: row.ownerName}
												</small>
											</div>
										</div>
									</td>
									<td>{row.user?.role || row.projectTitle || row.ownerName || '—'}</td>
									<td>
										<Status value={row.deletedAt ? 'REMOVED' : row.status} />
									</td>
									<td className="admin-date">
										{new Date(row.updatedAt).toLocaleDateString('en-GB', {
											day: 'numeric',
											month: 'short',
											year: 'numeric',
										})}
									</td>
									<td>
										<Button secondary onClick={() => setSelected(row)}>
											{kind === 'COMMENTS' ? translate('Review') : translate('Manage')}
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{!result.loading && result.value?.length === 0 && (
					<div className="admin-empty">
						<h2>
							{translate('No matching')} {labels[kind].toLowerCase()}
						</h2>
						<p>{translate('Try another search or status. Choose All records to include removed content.')}</p>
					</div>
				)}
				<div className="admin-pagination">
					<span>
						{total} {translate('records · Page')} {page}
					</span>
					<div>
						<Button
							secondary
							disabled={page === 1 || result.loading || pagination.checkingNext}
							onClick={() => setFilter({ ...filter, page: page - 1 })}
						>
							{translate('Previous')}
						</Button>
						<Button
							secondary
							disabled={page * 20 >= total || result.loading || pagination.checkingNext || pagination.noMoreResults}
							onClick={async () => {
								if (await pagination.next()) window.scrollTo({ top: 0, behavior: 'auto' });
							}}
						>
							{translate('Next')}
						</Button>
					</div>
				</div>
				{pagination.checkingNext && <p className="pagination-notice" role="status">{translate('Checking for more results…')}</p>}
				{pagination.noMoreResults && <p className="pagination-notice" role="status">{translate('No more results')}</p>}
				{pagination.nextPageError && <p className="pagination-notice pagination-error" role="alert">{translate('Could not check the next page. Please try again.')}</p>}
			</section>
		</>
	);
}
