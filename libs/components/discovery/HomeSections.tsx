import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { Pause, Play, SpeakerHigh, SpeakerSlash } from 'phosphor-react';
import { useEffect, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useCreatorDirectory } from '../../hooks/useCreatorDirectory';
import { Empty, LinkButton, QueryState } from '../common/UI';
import { EventsSection } from '../events/Events';
import { ProjectCard } from './Cards';

function Introduction() {
	const { t: translate } = useSiteTranslation('common');

	const ref = useRef<HTMLVideoElement>(null);
	const pausedByUser = useRef(false);
	const inView = useRef(false);
	const [playing, setPlaying] = useState(false);
	const [muted, setMuted] = useState(true);
	const [error, setError] = useState(false);
	useEffect(() => {
		const video = ref.current;
		if (!video) return;
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
		const sync = () => {
			if (inView.current && !document.hidden && !pausedByUser.current && !reduced.matches)
				video.play().catch(() => setPlaying(false));
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
				<span className="playback-status">
					{muted ? <SpeakerSlash size={21} /> : <SpeakerHigh size={21} />}
					{playing
						? muted
							? translate('Playing without sound')
							: translate('Playing with sound')
						: translate('Video paused')}
				</span>
			</div>
			<figure>
				<div className="intro-player">
					<video
						ref={ref}
						src="/videos/creatorhub-introduction.mp4"
						poster="/videos/creatorhub-poster.png"
						muted={muted}
						loop
						playsInline
						preload="metadata"
						aria-label={translate('CreatorHub introduction')}
						onPlay={() => setPlaying(true)}
						onPause={() => setPlaying(false)}
						onError={() => setError(true)}
					/>
					<div className="video-controls">
						<button
							type="button"
							aria-label={playing ? translate('Pause introduction') : translate('Play introduction')}
							onClick={() => {
								const v = ref.current;
								if (!v) return;
								if (v.paused) {
									pausedByUser.current = false;
									v.play().catch(() => setError(true));
								} else {
									pausedByUser.current = true;
									v.pause();
								}
							}}
						>
							{playing ? <Pause size={20} weight="fill" /> : <Play size={20} weight="fill" />}
						</button>
						<button
							type="button"
							aria-label={muted ? translate('Turn sound on') : translate('Mute introduction')}
							aria-pressed={!muted}
							onClick={() => setMuted(!muted)}
						>
							{muted ? <SpeakerSlash size={20} /> : <SpeakerHigh size={20} />}
						</button>
					</div>
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
