import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';

export default function HeroBackdrop() {
	const { t: translate } = useSiteTranslation('common');
	const video = useRef<HTMLVideoElement>(null);
	const [motion, setMotion] = useState(false);

	// Desktop only, and never for visitors who ask for reduced motion.
	useEffect(() => {
		const query = window.matchMedia('(min-width: 701px) and (prefers-reduced-motion: no-preference)');
		const update = () => setMotion(query.matches);
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	}, []);

	// Browsers only autoplay muted video, and React sets `muted` too late for that check,
	// so set it on the element and start playback ourselves. If a start is refused or
	// interrupted, try again once the video can play or the tab becomes visible.
	useEffect(() => {
		const element = video.current;
		if (!motion || !element) return;
		element.muted = true;
		element.defaultMuted = true;
		const play = () => {
			if (!document.hidden && element.paused) element.play().catch(() => {});
		};
		play();
		element.addEventListener('canplay', play);
		document.addEventListener('visibilitychange', play);
		return () => {
			element.removeEventListener('canplay', play);
			document.removeEventListener('visibilitychange', play);
		};
	}, [motion]);

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
				</div>
			)}
		</>
	);
}
