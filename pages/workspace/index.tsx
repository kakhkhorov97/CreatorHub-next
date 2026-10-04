import Link from 'next/link';
import { date, Empty, Heading, LinkButton, Picture, QueryState, Status } from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import ReviewStatus from '../../libs/components/review/ReviewStatus';
import { useApi } from '../../libs/hooks/useApi';

function Workspace() {
	return (
		<Layout title="Your workspace" area="workspace">
			<Guard>
				<Overview />
			</Guard>
		</Layout>
	);
}

function Overview() {
	const profile = useApi('myCreatorProfile');
	const projects = useApi('getMyProjects', { input: { limit: 4 } }, !profile.value);
	const inquiries = useApi('getInquiries', { creatorInbox: true, input: { limit: 4 } }, !profile.value);
	return (
		<>
			<ReviewStatus kind="PROFILE" targetId={profile.value?._id} />
			<Heading title="Your workspace">
				{profile.value?.status === 'PUBLISHED' && (
					<Link passHref href={`/creators/${profile.value.slug}`}>
						View public profile
					</Link>
				)}
			</Heading>
			<section className="panel next-steps">
				<h2>Next steps</h2>
				<p className="muted">Keep building your presence on CreatorHub.</p>
				<div className="steps">
					<div>
						<h3>Creator profile</h3>
						{profile.value ? (
							<>
								<Status value={profile.value.status} />
								<p>{profile.value.headline}</p>
							</>
						) : (
							<p>Create your profile to start sharing your work.</p>
						)}
						<Link passHref href="/workspace/profile">
							{profile.value ? 'Edit profile' : 'Create profile'}
						</Link>
					</div>
					<div>
						<h3>Portfolio</h3>
						<p>Add your work and make it visible to potential clients.</p>
						<Link passHref href="/workspace/projects">
							Manage projects
						</Link>
					</div>
					<div>
						<h3>Services</h3>
						<p>Describe what you offer and what’s included.</p>
						<Link passHref href="/workspace/services">
							Manage services
						</Link>
					</div>
				</div>
				<div className="actions">
					<LinkButton href="/workspace/projects/new">New project</LinkButton>
					<LinkButton secondary href="/workspace/services/new">
						Add service
					</LinkButton>
				</div>
			</section>
			{profile.value && (
				<div className="grid two">
					<section className="panel">
						<div className="row">
							<h2>Recent projects</h2>
							<Link passHref href="/workspace/projects">
								View all
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
								<time title="Last updated">{date(p.updatedAt)}</time>
								<Link passHref href={`/workspace/projects/${p._id}`}>
									Edit
								</Link>
							</div>
						))}
						{!projects.loading && !projects.value?.length && <Empty title="No projects yet" />}
					</section>
					<section className="panel">
						<div className="row">
							<h2>Recent inquiries</h2>
							<Link passHref href="/inquiries?inbox=creator">
								View all
							</Link>
						</div>
						<QueryState loading={inquiries.loading} error={inquiries.error} />
						{inquiries.value?.map((i) => (
							<Link passHref className="list-row" key={i._id} href={`/inquiries/${i._id}`}>
								<span>{i.subject || 'Untitled inquiry'}</span>
								<Status value={i.status} />
								<time title="Last updated">{date(i.updatedAt)}</time>
							</Link>
						))}
						{!inquiries.loading && !inquiries.value?.length && <Empty title="No inquiries yet" />}
					</section>
				</div>
			)}
		</>
	);
}

export default Workspace;
