import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useCreatorDirectory } from '../../hooks/useCreatorDirectory';
import { Empty, LinkButton, Picture, QueryState } from '../common/UI';
import { EventsSection } from '../events/Events';

function Introduction() {
	const { t: translate } = useSiteTranslation('common');

	const ref = useRef<HTMLVideoElement>(null);
	const inView = useRef(false);
	const [error, setError] = useState(false);
	useEffect(() => {
		const video = ref.current;
		if (!video) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			if (inView.current && !document.hidden && !reduced.matches) video.play().catch(() => {});
			else video.pause();
		};
		const observer = new IntersectionObserver(
			([entry]) => {
				inView.current = entry.isIntersecting;
				sync();
			},
			{ threshold: 0.25 },
		);
		observer.observe(video);
		document.addEventListener('visibilitychange', sync);
		reduced.addEventListener('change', sync);
		return () => {
			observer.disconnect();
			document.removeEventListener('visibilitychange', sync);
			reduced.removeEventListener('change', sync);
			video.pause();
		};
	}, []);
	return (
		<section className="home-introduction" aria-labelledby="intro-title">
			<div className="intro-copy">
				<h2 id="intro-title">{translate('Meet CreatorHub')}</h2>
				<p>
					{translate(
						'Browse portfolios by discipline and city, follow the people whose work you like, and send them a private message when you have a project in mind.',
					)}
				</p>
				<div className="intro-actions">
					<LinkButton href="/account/register">{translate('Join CreatorHub')}</LinkButton>
					<Link passHref className="intro-secondary" href="/about">
						{translate('About CreatorHub')}
					</Link>
				</div>
			</div>
			<figure>
				<div className="intro-player">
					<video
						ref={ref}
						src="/videos/creatorhub-introduction.mp4"
						poster="/videos/creatorhub-poster.png"
						muted
						autoPlay
						controls={false}
						disablePictureInPicture
						loop
						playsInline
						preload="metadata"
						aria-label={translate('CreatorHub introduction')}
						onError={() => setError(true)}
					/>
				</div>
				{error && (
					<figcaption>
						<a href="/videos/creatorhub-introduction.mp4">{translate('Open the introduction video')}</a>
					</figcaption>
				)}
			</figure>
		</section>
	);
}

export default function HomeSections({
	popularIds,
	loadingPopular,
}: {
	popularIds: string[];
	loadingPopular: boolean;
}) {
	const { t: translate } = useSiteTranslation('common');

	const recent = useApi(
		'getProjects',
		{ input: { sort: 'RECENT', limit: 5, excludeProjectIds: popularIds } },
		loadingPopular,
	);
	const cats = useApi('categories');
	const directory = useCreatorDirectory((recent.value || []).map((p) => p.creatorId));
	return (
		<>
			<Introduction />
			<section className="home-section">
				<div className="home-section-heading">
					<div>
						<h2>{translate('Recently added')}</h2>
						<p className="muted">{translate('New work to discover, beyond the popular selection.')}</p>
					</div>
					<Link passHref href="/projects">
						{translate('View all projects →')}
					</Link>
				</div>
				<QueryState loading={recent.loading || loadingPopular} error={recent.error} retry={() => recent.refetch()} />
				{!loadingPopular && !recent.loading && !recent.error && !recent.value?.length && (
					<Empty title={translate('More work is on its way')}>
						{translate('New published projects will appear here.')}
					</Empty>
				)}
				<div className="recent-grid">
					{recent.value?.map((p) => (
						<Link passHref key={p._id} href={`/projects/${p._id}`} className="recent-item">
							<Picture src={p.coverImageUrl} alt="" />
							<span className="recent-title">{p.title}</span>
							{directory[p.creatorId] && (
								<span className="recent-creator">{directory[p.creatorId].identity.displayName}</span>
							)}
						</Link>
					))}
				</div>
			</section>

			<EventsSection home />
		</>
	);
}
