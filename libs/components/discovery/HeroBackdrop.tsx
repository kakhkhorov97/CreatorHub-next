import { useEffect, useState } from 'react';
export default function HeroBackdrop() {
	const [motion, setMotion] = useState(false);
	useEffect(() => {
		const query = window.matchMedia('(min-width: 701px) and (prefers-reduced-motion: no-preference)');
		const update = () => setMotion(query.matches);
		update();
		query.addEventListener('change', update);
		return () => query.removeEventListener('change', update);
	}, []);
	return (
		<div className="hero-backdrop" aria-hidden>
			{motion && (
				<video
					src="/videos/creatorhub-introduction.mp4"
					autoPlay
					muted
					loop
					playsInline
					controls={false}
					tabIndex={-1}
				/>
			)}
		</div>
	);
}
