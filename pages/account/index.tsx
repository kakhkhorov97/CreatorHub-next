import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { CaretRight, Plus } from 'phosphor-react';
import { userVar } from '../../apollo/store';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { date, label, Picture, Status } from '../../libs/components/common/UI';
import { useApi } from '../../libs/hooks/useApi';
import { MetaCounter } from '../../libs/types/creatorhub';

export default function MyPage() {
	const { t } = useTranslation('common');
	return (
		<Layout title={t('My page')} area="account">
			<Guard>
				<AccountOverview />
			</Guard>
		</Layout>
	);
}

// Totals arrive as an aggregation facet: an empty list means zero.
const total = (counter?: MetaCounter[]) => counter?.[0]?.total ?? 0;

function AccountOverview() {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar)!;
	const creator = user.role !== 'ADMIN';
	const profile = useApi('myCreatorProfile', {}, !creator);
	const hasProfile = Boolean(profile.value);
	const projects = useApi('getMyProjects', { input: { limit: 4 } }, !hasProfile);
	const followers = useApi('getMyFollowers', { input: { limit: 1 } });
	const following = useApi('getMyFollows', { input: { limit: 1 } });
	const saved = useApi('getSavedProjects', { input: { limit: 4 } });
	const notifications = useApi('getNotifications', { input: { limit: 3 } });
	const stats = [
		{
			href: '/following?tab=followers',
			value: total(followers.data?.getMyFollowers.metaCounter),
			label: t('Followers'),
		},
		{ href: '/following?tab=following', value: total(following.data?.getMyFollows.metaCounter), label: t('Following') },
		{ href: '/saved', value: total(saved.data?.getSavedProjects.metaCounter), label: t('Saved'), wide: true },
		...(hasProfile
			? [
					{
						href: '/workspace/projects',
						value: total(projects.data?.getMyProjects.metaCounter),
						label: t('Projects'),
						wide: true,
					},
			  ]
			: []),
	];
	const savedRows = (saved.value || []).filter((row) => row.available && row.project);

	return (
		<div className="my-page">
			<header className="my-page-head">
				<h1>{t('My page')}</h1>
				<p className="muted">{t('Your account, saved work and connections.')}</p>
			</header>
			<aside className="my-page-side">
				<div className="my-page-card">
					<section className="account-overview-identity" aria-label={t('Your profile')}>
						<Picture avatar src={user.avatarUrl} alt="" sizes="72px" />
						<div>
							<h2>{user.displayName}</h2>
							<p>{profile.value?.city ? `${t('Creator')} · ${t(label(profile.value.city))}` : t('Signed in')}</p>
						</div>
					</section>
					<nav className="my-page-stats" aria-label={t('Followers & Following')}>
						{stats.map((stat) => (
							<Link key={stat.href} href={stat.href} className={stat.wide ? 'is-wide' : undefined}>
								<b>{stat.value}</b>
								<span>{stat.label}</span>
							</Link>
						))}
					</nav>
					<nav className="my-page-card-links" aria-label={t('Your account')}>
						{profile.value?.status === 'PUBLISHED' && (
							<Link href={`/creators/${profile.value.slug}`}>
								{t('View my public profile')}
								<CaretRight aria-hidden />
							</Link>
						)}
						<Link href="/account/settings">
							{t('Account settings')}
							<CaretRight aria-hidden />
						</Link>
					</nav>
				</div>
			</aside>

			<div className="my-page-main">
				{creator && (
					<section className="my-page-panel my-page-workspace" aria-labelledby="my-workspace-title">
						<div className="my-page-panel-heading">
							<h2 id="my-workspace-title">{t('Workspace')}</h2>
							<Link href="/workspace">{t('Open workspace →')}</Link>
						</div>
						<div className="my-page-workspace-tiles">
							<Link href="/workspace/projects/new" className="is-new">
								<Plus size={22} aria-hidden />
								<strong>{t('New project')}</strong>
							</Link>
							{projects.value?.map((project) => (
								<Link key={project._id} href={`/workspace/projects/${project._id}`} aria-label={project.title}>
									<Picture src={project.coverImageUrl} alt="" sizes="160px" />
									<Status value={project.status} />
								</Link>
							))}
						</div>
					</section>
				)}

				<div className="my-page-pair">
					<section className="my-page-panel my-page-saved" aria-labelledby="my-saved-title">
						<div className="my-page-panel-heading">
							<h2 id="my-saved-title">{t('Saved projects')}</h2>
							<Link href="/saved">{t('See all →')}</Link>
						</div>
						{savedRows.length ? (
							<div className="my-page-saved-grid">
								{savedRows.map((row) => (
									<Link key={row.projectId} href={`/projects/${row.projectId}`} aria-label={row.project!.title}>
										<Picture src={row.project!.coverImageUrl} alt="" sizes="200px" />
									</Link>
								))}
							</div>
						) : (
							<p className="muted">{t('Projects you save appear here.')}</p>
						)}
					</section>

					<section className="my-page-panel my-page-notifications" aria-labelledby="my-notifications-title">
						<div className="my-page-panel-heading">
							<h2 id="my-notifications-title">{t('Notifications')}</h2>
							<Link href="/notifications">{t('See all →')}</Link>
						</div>
						{notifications.value?.length ? (
							<ul>
								{notifications.value.map((n) => {
									const href = n.event
										? `/inquiries/${n.event.inquiryId}`
										: n.activityEvent?.projectId
										? `/projects/${n.activityEvent.projectId}`
										: '/notifications';
									return (
										<li key={n._id} className={n.readAt ? '' : 'unread'}>
											<Link href={href}>
												<i aria-hidden />
												<span>
													{n.unavailable
														? t('This activity is no longer available')
														: t(label(n.event?.type || n.activityEvent?.type))}
													<time dateTime={n.createdAt}>{date(n.createdAt)}</time>
												</span>
											</Link>
										</li>
									);
								})}
							</ul>
						) : (
							<p className="muted">{t('You’re all caught up')}</p>
						)}
					</section>
				</div>

				{/* Phones keep the simple list; on a computer these live in the card and the panels. */}
				<nav className="account-overview-links" aria-label={t('Your account')}>
					<Link href="/saved">
						<div>
							<strong>{t('Saved projects')}</strong>
							<p>{t('Revisit the projects you saved.')}</p>
						</div>
						<CaretRight aria-hidden />
					</Link>
					<Link href="/account/settings">
						<div>
							<strong>{t('Account settings')}</strong>
							<p>{t('Edit your photo, name and language.')}</p>
						</div>
						<CaretRight aria-hidden />
					</Link>
				</nav>
			</div>
		</div>
	);
}
