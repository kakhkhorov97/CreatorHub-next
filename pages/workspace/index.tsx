import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { date, Empty, Heading, Picture, QueryState, Status } from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import ReviewStatus from '../../libs/components/review/ReviewStatus';
import { useApi } from '../../libs/hooks/useApi';
import { Briefcase, ListBullets, Plus, UserCircle } from 'phosphor-react';

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
			<section className="workspace-summary" aria-label={translate('Creator profile')}>
				{profile.value ? (
					<p className="workspace-status">
						{translate('Profile status')}: <Status value={profile.value.status} />
					</p>
				) : (
					<p className="workspace-status">{translate('Create your profile to start sharing your work.')}</p>
				)}
				<nav className="workspace-actions" aria-label={translate('Quick actions')}>
					<Link href="/workspace/projects/new" className="is-primary">
						<Plus size={20} aria-hidden />
						<span>{translate('New project')}</span>
					</Link>
					<Link href="/workspace/services/new">
						<Briefcase size={20} aria-hidden />
						<span>{translate('New service')}</span>
					</Link>
					<Link href="/workspace/profile">
						<UserCircle size={20} aria-hidden />
						<span>{profile.value ? translate('Edit profile') : translate('Create profile')}</span>
					</Link>
					<Link href="/workspace/services">
						<ListBullets size={20} aria-hidden />
						<span>{translate('My services')}</span>
					</Link>
				</nav>
			</section>
			{profile.value && (
				<div className="grid two">
					<section className="panel">
						<div className="row">
							<h2>{translate('Your work')}</h2>
							<Link passHref href="/workspace/projects">
								{translate('View all')}
							</Link>
						</div>
						<QueryState loading={projects.loading} error={projects.error} />
						<div className="workspace-work">
							{projects.value?.map((p) => (
								<Link passHref href={`/workspace/projects/${p._id}`} className="workspace-work-item" key={p._id}>
									<span className="workspace-work-image">
										<Picture src={p.coverImageUrl} alt="" />
										<Status value={p.status} />
									</span>
									<strong>{p.title}</strong>
									<time title={translate('Last updated')}>{date(p.updatedAt)}</time>
								</Link>
							))}
						</div>
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
