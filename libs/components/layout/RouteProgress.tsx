import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

/** Thin bar at the top while Next.js loads the next page, so a click always shows a response. */
export default function RouteProgress() {
	const router = useRouter();
	const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
	useEffect(() => {
		let delay: number | undefined;
		let hide: number | undefined;
		const start = (url: string, { shallow }: { shallow: boolean }) => {
			if (shallow) return;
			window.clearTimeout(hide);
			// Fast changes finish before the bar appears, so it never flickers.
			delay = window.setTimeout(() => setState('loading'), 120);
		};
		const end = () => {
			window.clearTimeout(delay);
			setState((current) => (current === 'loading' ? 'done' : 'idle'));
			hide = window.setTimeout(() => setState('idle'), 300);
		};
		router.events.on('routeChangeStart', start);
		router.events.on('routeChangeComplete', end);
		router.events.on('routeChangeError', end);
		return () => {
			window.clearTimeout(delay);
			window.clearTimeout(hide);
			router.events.off('routeChangeStart', start);
			router.events.off('routeChangeComplete', end);
			router.events.off('routeChangeError', end);
		};
	}, [router.events]);
	return <div className={`route-progress is-${state}`} aria-hidden />;
}
