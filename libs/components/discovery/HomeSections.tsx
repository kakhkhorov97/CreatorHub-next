import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useCreatorDirectory } from '../../hooks/useCreatorDirectory';
import { Empty, LinkButton, QueryState } from '../common/UI';
import { EventsSection } from '../events/Events';
import { ProjectCard } from './Cards';

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
					{translate('Discover creative work.')}
					<br />
					{translate('Connect with creators.')}
					<br />
					{translate('Start a conversation.')}
				</p>
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
				<figcaption>
					{error ? (
						<a href="/videos/creatorhub-introduction.mp4">{translate('Open the introduction video')}</a>
					) : (
						translate('CreatorHub introduction')
					)}
				</figcaption>
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
		{ input: { sort: 'RECENT', limit: 6, excludeProjectIds: popularIds } },
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
				<div className="grid projects">
					{recent.value?.map((p) => (
						<ProjectCard key={p._id} project={p} creator={directory[p.creatorId]} />
					))}
				</div>
			</section>

			<EventsSection home />
			<section className="home-about home-section">
				<div>
					<h2>{translate('Creative work brings us together.')}</h2>
					<p>
						{translate(
							'CreatorHub is a place for independent creators and people looking for their next collaborator. Explore portfolios, find services, and start a private conversation about your project, across Korea.',
						)}
					</p>
					<Link passHref href="/about">
						{translate('More about CreatorHub →')}
					</Link>
				</div>
				<div>
					<h3>{translate('Make your next connection.')}</h3>
					<p>{translate('Create an account to save work, follow creators, or publish your own portfolio.')}</p>
					<LinkButton href="/account/register">{translate('Join CreatorHub')}</LinkButton>
					<Link passHref className="home-contact-link" href="/contact">
						{translate('Contact us →')}
					</Link>
				</div>
			</section>
		</>
	);
}
