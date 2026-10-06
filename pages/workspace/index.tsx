import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { date, Empty, Heading, LinkButton, Picture, QueryState, Status } from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import ReviewStatus from '../../libs/components/review/ReviewStatus';
import { useApi } from '../../libs/hooks/useApi';

function Workspace() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Your workspace')} area="workspace">
			<Guard>
				<Overview />
			</Guard>
		</Layout>
	);
}

function Overview() {
	const { t: translate } = useSiteTranslation('common');

	const profile = useApi('myCreatorProfile');
	const projects = useApi('getMyProjects', { input: { limit: 4 } }, !profile.value);
	const inquiries = useApi('getInquiries', { creatorInbox: true, input: { limit: 4 } }, !profile.value);
	return (
		<>
			<ReviewStatus kind="PROFILE" targetId={profile.value?._id} />
			<Heading title={translate('Your workspace')}>
				{profile.value?.status === 'PUBLISHED' && (
					<Link passHref href={`/creators/${profile.value.slug}`}>
						{translate('View public profile')}
					</Link>
				)}
			</Heading>
			<section className="panel next-steps">
				<h2>{translate('Next steps')}</h2>
				<p className="muted">{translate('Keep building your presence on CreatorHub.')}</p>
				<div className="steps">
					<div>
						<h3>{translate('Creator profile')}</h3>
						{profile.value ? (
							<>
								<Status value={profile.value.status} />
								<p>{profile.value.headline}</p>
							</>
						) : (
							<p>{translate('Create your profile to start sharing your work.')}</p>
						)}
						<Link passHref href="/workspace/profile">
							{profile.value ? translate('Edit profile') : translate('Create profile')}
						</Link>
					</div>
					<div>
						<h3>{translate('Portfolio')}</h3>
						<p>{translate('Add your work and make it visible to potential clients.')}</p>
						<Link passHref href="/workspace/projects">
							{translate('Manage projects')}
						</Link>
					</div>
					<div>
						<h3>{translate('Services')}</h3>
						<p>{translate('Describe what you offer and what’s included.')}</p>
						<Link passHref href="/workspace/services">
							{translate('Manage services')}
						</Link>
					</div>
				</div>
				<div className="actions">
					<LinkButton href="/workspace/projects/new">{translate('New project')}</LinkButton>
					<LinkButton secondary href="/workspace/services/new">
						{translate('Add service')}
					</LinkButton>
				</div>
			</section>
			{profile.value && (
				<div className="grid two">
					<section className="panel">
						<div className="row">
							<h2>{translate('Recent projects')}</h2>
							<Link passHref href="/workspace/projects">
								{translate('View all')}
							</Link>
						</div>
						<QueryState loading={projects.loading} error={projects.error} />
						{projects.value?.map((p) => (
							<div className="list-row" key={p._id}>
								<div className="creator-line">
									<Picture src={p.coverImageUrl} />
									<strong>{p.title}</strong>
								</div>
								<Status value={p.status} />
								<time title={translate('Last updated')}>{date(p.updatedAt)}</time>
								<Link passHref href={`/workspace/projects/${p._id}`}>
									{translate('Edit')}
								</Link>
							</div>
						))}
						{!projects.loading && !projects.value?.length && <Empty title={translate('No projects yet')} />}
					</section>
					<section className="panel">
						<div className="row">
							<h2>{translate('Recent inquiries')}</h2>
							<Link passHref href="/inquiries?inbox=creator">
								{translate('View all')}
							</Link>
						</div>
						<QueryState loading={inquiries.loading} error={inquiries.error} />
						{inquiries.value?.map((i) => (
							<Link passHref className="list-row" key={i._id} href={`/inquiries/${i._id}`}>
								<span>{i.subject || translate('Untitled inquiry')}</span>
								<Status value={i.status} />
								<time title={translate('Last updated')}>{date(i.updatedAt)}</time>
							</Link>
						))}
						{!inquiries.loading && !inquiries.value?.length && <Empty title={translate('No inquiries yet')} />}
					</section>
				</div>
			)}
		</>
	);
}

export default Workspace;
