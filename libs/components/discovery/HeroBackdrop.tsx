import { useTranslation as useSiteTranslation } from 'next-i18next';
import { Pause, Play } from 'phosphor-react';
import { useEffect, useRef, useState } from 'react';

export default function HeroBackdrop() {
	const { t: translate } = useSiteTranslation('common');
	const video = useRef<HTMLVideoElement>(null);
	const [motion, setMotion] = useState(false);
	const [paused, setPaused] = useState(false);

	// Desktop only, and never for visitors who ask for reduced motion.
	useEffect(() => {
		const query = window.matchMedia('(min-width: 701px) and (prefers-reduced-motion: no-preference)');
		const update = () => setMotion(query.matches);
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	}, []);

	useEffect(() => {
		const element = video.current;
		if (!element) return;
		if (paused) element.pause();
		else element.play().catch(() => setPaused(true));
	}, [paused, motion]);

	return (
		<>
			<div className="hero-backdrop" aria-hidden>
				{motion && (
					<video
						ref={video}
						poster="/videos/creatorhub-hero-poster.jpg"
						autoPlay
						muted
						loop
						playsInline
						preload="auto"
						disablePictureInPicture
						tabIndex={-1}
					>
						<source src="/videos/creatorhub-hero.webm" type="video/webm" />
						<source src="/videos/creatorhub-hero.mp4" type="video/mp4" />
					</video>
				)}
			</div>
			{motion && (
				<div className="hero-video-controls">
					<span>{translate('Background: fictional studio scenes')}</span>
					<button
						type="button"
						className="hero-video-toggle"
						aria-label={translate(paused ? 'Play background video' : 'Pause background video')}
						onClick={() => setPaused((value) => !value)}
					>
						{paused ? <Play size={16} weight="fill" aria-hidden /> : <Pause size={16} weight="fill" aria-hidden />}
					</button>
				</div>
			)}
		</>
	);
}
