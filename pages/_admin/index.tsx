import Link from 'next/link';
import { ArrowRight } from 'phosphor-react';
import AdminLayout from '../../libs/components/admin/AdminLayout';
import { Picture, QueryState, Status } from '../../libs/components/common/UI';
import { useApi } from '../../libs/hooks/useApi';

function Overview() {
	return (
		<AdminLayout title="Overview">
			<OverviewContent />
		</AdminLayout>
	);
}

function OverviewContent() {
	const result = useApi('adminOverview'),
		recent = useApi('adminDirectory', { kind: 'PROJECTS', input: { limit: 5, removed: false } });
	const titles = {
		users: 'Users',
		creators: 'Creators',
		projects: 'Projects',
		services: 'Services',
		comments: 'Comments',
		categories: 'Categories',
		events: 'Events',
	};
	return (
		<>
			<div className="admin-page-heading">
				<div>
					<h1>Website overview</h1>
					<p>Manage the people, work and content behind CreatorHub.</p>
				</div>
				<Link passHref href="/" className="admin-text-link">
					Open website <ArrowRight size={18} />
				</Link>
			</div>
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			<div className="admin-metrics">
				{result.value &&
					Object.entries(result.value)
						.filter(([key]) => key in titles)
						.map(([key, value]) => (
							<Link passHref href={`/_admin/${key}`} key={key}>
								<span>{titles[key as keyof typeof titles]}</span>
								<strong>{String(value)}</strong>
								<small>
									Manage {key} <ArrowRight size={15} />
								</small>
							</Link>
						))}
			</div>
			<div className="admin-overview-grid">
				<section className="admin-panel">
					<div className="admin-panel-heading">
						<h2>Recently updated projects</h2>
						<Link passHref href="/_admin/projects">
							All projects →
						</Link>
					</div>
					<QueryState loading={recent.loading} error={recent.error} retry={() => recent.refetch()} />
					{recent.value?.map((row) => (
						<div className="admin-recent" key={row._id}>
							<Picture src={row.project?.coverImageUrl} alt="" />
							<div>
								<strong>{row.title}</strong>
								<small>{row.ownerName || 'Creator'}</small>
							</div>
							<Status value={row.status} />
						</div>
					))}
					{recent.value?.length === 0 && <p>No projects yet. Create the first project from the Projects page.</p>}
				</section>
				<section className="admin-panel admin-quick">
					<h2>Publishing & settings</h2>
					<p>
						Keep public content current. Draft, hidden and removed records remain available in their management pages.
					</p>
					<Link passHref href="/_admin/projects">
						Publish or archive projects <ArrowRight size={18} />
					</Link>
					<Link passHref href="/_admin/events">
						Manage community events <ArrowRight size={18} />
					</Link>
					<Link passHref href="/_admin/content">
						Edit website copy & contact <ArrowRight size={18} />
					</Link>
					<Link passHref href="/_admin/users">
						Review account access <ArrowRight size={18} />
					</Link>
					<div className="admin-note">
						Counts include retained records across all publication states. Removed records are excluded.
					</div>
				</section>
			</div>
		</>
	);
}

export default Overview;
