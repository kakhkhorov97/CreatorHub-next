import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { ArrowRight } from 'phosphor-react';
import AdminLayout from '../../libs/components/admin/AdminLayout';
import { Picture, QueryState, Status } from '../../libs/components/common/UI';
import { useApi } from '../../libs/hooks/useApi';

function Overview() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<AdminLayout title={translate('Overview')}>
			<OverviewContent />
		</AdminLayout>
	);
}

function OverviewContent() {
	const { t: translate } = useSiteTranslation('common');

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
					<h1>{translate('Website overview')}</h1>
					<p>{translate('Manage the people, work and content behind CreatorHub.')}</p>
				</div>
				<Link passHref href="/" className="admin-text-link">
					{translate('Open website')} <ArrowRight size={18} />
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
									{translate('Manage')} {key} <ArrowRight size={15} />
								</small>
							</Link>
						))}
			</div>
			<div className="admin-overview-grid">
				<section className="admin-panel">
					<div className="admin-panel-heading">
						<h2>{translate('Recently updated projects')}</h2>
						<Link passHref href="/_admin/projects">
							{translate('All projects →')}
						</Link>
					</div>
					<QueryState loading={recent.loading} error={recent.error} retry={() => recent.refetch()} />
					{recent.value?.map((row) => (
						<div className="admin-recent" key={row._id}>
							<Picture src={row.project?.coverImageUrl} alt="" />
							<div>
								<strong>{row.title}</strong>
								<small>{row.ownerName || translate('Creator')}</small>
							</div>
							<Status value={row.status} />
						</div>
					))}
					{recent.value?.length === 0 && (
						<p>{translate('No projects yet. Create the first project from the Projects page.')}</p>
					)}
				</section>
				<section className="admin-panel admin-quick">
					<h2>{translate('Publishing & settings')}</h2>
					<p>
						{translate(
							'Keep public content current. Draft, hidden and removed records remain available in their management pages.',
						)}
					</p>
					<Link passHref href="/_admin/projects">
						{translate('Publish or archive projects')} <ArrowRight size={18} />
					</Link>
					<Link passHref href="/_admin/events">
						{translate('Manage community events')} <ArrowRight size={18} />
					</Link>
					<Link passHref href="/_admin/content">
						{translate('Edit website copy & contact')} <ArrowRight size={18} />
					</Link>
					<Link passHref href="/_admin/users">
						{translate('Review account access')} <ArrowRight size={18} />
					</Link>
					<div className="admin-note">
						{translate('Counts include retained records across all publication states. Removed records are excluded.')}
					</div>
				</section>
			</div>
		</>
	);
}

export default Overview;
