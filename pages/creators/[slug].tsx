import { useTranslation as useSiteTranslation } from 'next-i18next';
import { Rating } from '../../libs/components/inquiry/ServiceFeedback';
import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowUpRight, MapPin, WifiHigh } from 'phosphor-react';
import { useState } from 'react';
import { userVar } from '../../apollo/store';
import {
	Button,
	Empty,
	Feedback,
	label,
	LinkButton,
	Pager,
	Picture,
	QueryState,
	safeUrl,
} from '../../libs/components/common/UI';
import { ProjectCard, ServiceCard } from '../../libs/components/discovery/Cards';
import Layout from '../../libs/components/layout/LayoutBasic';
import { useAction, useApi } from '../../libs/hooks/useApi';
import { useMembership } from '../../libs/hooks/useMembership';
import { usePaged } from '../../libs/hooks/usePaged';

function CreatorDetail() {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const slug = String(router.query.slug || '');
	const profile = useApi('creator', { slug }, !slug);
	const creator = profile.value;
	const projects = usePaged('getProjects', { input: { creatorId: creator?._id } }, !creator);
	const services = usePaged('getServices', { input: { creatorId: creator?._id } }, !creator);
	const reviews = usePaged('getCreatorFeedback', { creatorId: creator?._id || '' }, !creator);
	const [tab, setTab] = useState('Work');
	const user = useReactiveVar(userVar);
	const action = useAction();
	const membership = useMembership('following', creator?._id || '');
	const followed = membership.active;
	const setFollowed = membership.setActive;
	return (
		<Layout title={creator?.identity.displayName || translate('Creator profile')}>
			<QueryState loading={profile.loading} error={profile.error} retry={() => profile.refetch()} />
			{creator && (
				<>
					<div className="profile-breadcrumb">
						<Link passHref href="/creators">
							{translate('Creators')}
						</Link>
						<span>/</span>
						<span>{creator.identity.displayName}</span>
					</div>
					<section className="profile-header">
						<Picture avatar src={creator.identity.avatarUrl} alt={creator.identity.displayName} />
						<div className="profile-copy">
							<h1>{creator.identity.displayName}</h1>
							<h2>{creator.headline}</h2>
							<div className="metadata">
								<span>
									<MapPin />
									{label(creator.city)}
								</span>
								{creator.remoteAvailable && (
									<span>
										<WifiHigh />
										{translate('Remote available')}
									</span>
								)}
								<span className={`availability ${creator.availability.toLowerCase()}`}>
									{label(creator.availability)}
								</span>
							</div>
						</div>
						{user?._id !== creator.userId && (
							<div className="actions creator-profile-actions">
								<LinkButton href={`/inquiries/new?creatorId=${creator._id}`}>{translate('Send inquiry')}</LinkButton>
								<Button
									secondary
									danger={followed === true}
									aria-pressed={followed === true}
									disabled={action.busy || membership.loading}
									onClick={() => {
										if (!user) {
											router.push(`/account/sign-in?returnTo=${encodeURIComponent(router.asPath)}`);
											return;
										}
										action.run(async () => {
											await action.mutate('setCreatorFollow', { creatorId: creator._id, following: followed !== true });
											setFollowed(followed !== true);
										});
									}}
								>
									{followed ? translate('Unfollow') : translate('Follow')}
								</Button>
							</div>
						)}
					</section>
					<Feedback error={action.error} />
					<nav className="tabs">
						{['Work', 'Services', 'About', 'Reviews'].map((t) => (
							<button key={t} onClick={() => setTab(t)} className={tab === t ? 'active' : ''}>
								{t}
							</button>
						))}
					</nav>
					<div className="detail-layout">
						<section>
							{tab === 'Work' && (
								<>
									<QueryState loading={projects.loading} error={projects.error} />
									<div className="grid two profile-work">
										{projects.rows.map((p) => (
											<ProjectCard key={p._id} project={p} creator={creator} />
										))}
									</div>
									{!projects.loading && !projects.rows.length && (
										<Empty title={translate('No published projects yet')} />
									)}
									<Pager {...projects} />
								</>
							)}
							{tab === 'Services' && (
								<>
									<QueryState loading={services.loading} error={services.error} />
									<div className="grid two">
										{services.rows.map((s) => (
											<ServiceCard key={s._id} service={s} />
										))}
									</div>
									{!services.loading && !services.rows.length && <Empty title={translate('No active services yet')} />}
									<Pager {...services} />
								</>
							)}
							{tab === 'Reviews' && (
								<>
									<QueryState loading={reviews.loading} error={reviews.error} />
									{reviews.rows.map((review) => (
										<article className="customer-review" key={review._id}>
											<Rating value={review.rating} />
											<p className="prose-text">{review.feedback}</p>
											<small>
												{review.authorName} · {new Date(review.createdAt).toLocaleDateString()}
											</small>
										</article>
									))}
									{!reviews.loading && !reviews.rows.length && <Empty title={translate('No customer reviews yet')} />}
									<Pager {...reviews} />
								</>
							)}
							{tab === 'About' && (
								<div className="prose">
									<h2>
										{translate('About')} {creator.identity.displayName}
									</h2>
									<p>{creator.bio || translate('This creator has not added a bio yet.')}</p>
								</div>
							)}
						</section>
						<aside className="detail-sidebar">
							<h2>{translate('Services')}</h2>
							{services.rows.slice(0, 2).map((s) => (
								<ServiceCard key={s._id} service={s} />
							))}
							<h2>{translate('Skills')}</h2>
							<div className="tags">
								{creator.skills.map((skill) => (
									<span key={skill}>{skill}</span>
								))}
							</div>
							{!!creator.socialLinks.length && (
								<>
									<h2>{translate('External portfolio')}</h2>
									{creator.socialLinks
										.filter((l) => safeUrl(l.url))
										.map((l) => (
											<a className="external-link" key={l.url} href={l.url} target="_blank" rel="noreferrer">
												{l.label}
												<ArrowUpRight />
											</a>
										))}
								</>
							)}
						</aside>
					</div>
				</>
			)}
		</Layout>
	);
}

export default CreatorDetail;
