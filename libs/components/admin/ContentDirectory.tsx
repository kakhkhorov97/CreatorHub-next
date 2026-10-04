import { MagnifyingGlass, Plus } from 'phosphor-react';
import { FormEvent, useState } from 'react';
import { useApi } from '../../hooks/useApi';
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
	const [filter, setFilter] = useState<AdminDirectoryInput>({ page: 1, limit: 20 });
	const result = useApi('adminDirectory', { kind, input: filter });
	const [selected, setSelected] = useState<AdminEntry | 'new' | null>(null);
	const total = result.data?.adminDirectory.metaCounter[0]?.total ?? 0;
	const page = filter.page || 1;
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
							? 'Manage accounts, roles and access.'
							: kind === 'COMMENTS'
							? 'Review project conversations and moderate public comments.'
							: `Manage every ${kind.toLowerCase().slice(0, -1)}, including unpublished work.`}
					</p>
				</div>
				{['PROJECTS', 'SERVICES'].includes(kind) && (
					<Button onClick={() => setSelected('new')}>
						<Plus size={18} /> New {kind === 'PROJECTS' ? 'project' : 'service'}
					</Button>
				)}
			</div>
			<section className="admin-panel">
				<form className="admin-filters" onSubmit={search}>
					<Field
						label="Search"
						name="search"
						placeholder={
							kind === 'USERS' ? 'Search names…' : kind === 'CREATORS' ? 'Search profile, city…' : 'Search content…'
						}
						maxLength={100}
					/>
					<Field label="Status">
						<select name="status">
							<option value="">All statuses</option>
							{states[kind].map((s) => (
								<option key={s} value={s}>
									{s.toLowerCase()}
								</option>
							))}
						</select>
					</Field>
					{kind === 'USERS' && (
						<Field label="Role">
							<select name="role">
								<option value="">All roles</option>
								{['USER', 'CREATOR', 'ADMIN'].map((s) => (
									<option key={s}>{s}</option>
								))}
							</select>
						</Field>
					)}
					<Field label="Records">
						<select name="removed" defaultValue="all">
							<option value="all">All records</option>
							<option value="no">Retained</option>
							<option value="yes">Removed</option>
						</select>
					</Field>
					<Button type="submit" secondary>
						<MagnifyingGlass size={18} /> Search
					</Button>
				</form>
				<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
				<p className="admin-table-hint">Scroll the table sideways to see all controls.</p>
				<div className="admin-table-scroll">
					<table className="admin-table">
						<thead>
							<tr>
								<th>{kind === 'USERS' ? 'Account' : kind === 'COMMENTS' ? 'Comment' : 'Name'}</th>
								<th>{kind === 'USERS' ? 'Role' : kind === 'COMMENTS' ? 'Project' : 'Creator'}</th>
								<th>Status</th>
								<th>Updated</th>
								<th>
									<span className="sr-only">Actions</span>
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
											{kind === 'COMMENTS' ? 'Review' : 'Manage'}
										</Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				{!result.loading && result.value?.length === 0 && (
					<div className="admin-empty">
						<h2>No matching {labels[kind].toLowerCase()}</h2>
						<p>Try another search or status. Choose All records to include removed content.</p>
					</div>
				)}
				<div className="admin-pagination">
					<span>
						{total} records · Page {page}
					</span>
					<div>
						<Button
							secondary
							disabled={page === 1 || result.loading}
							onClick={() => setFilter({ ...filter, page: page - 1 })}
						>
							Previous
						</Button>
						<Button
							secondary
							disabled={page * 20 >= total || result.loading}
							onClick={() => setFilter({ ...filter, page: page + 1 })}
						>
							Next
						</Button>
					</div>
				</div>
			</section>
		</>
	);
}
