import { useEffect, useRef, useState } from 'react';

export function createHeaderScrollController(initialY = 0) {
	let compact = initialY > 80;
	return {
		update(rawY: number, maximumY: number, pinned = false) {
			// Ignore elastic overscroll and keep focused controls mounted.
			if (pinned || !Number.isFinite(rawY) || rawY > maximumY) return compact;
			const y = Math.max(0, rawY);
			if (y > 80) compact = true;
			else if (y <= 24) compact = false;
			return compact;
		},
	};
}

export default function useHeaderScroll(pathname: string, route: string) {
	const header = useRef<HTMLDivElement>(null);
	const [compact, setCompact] = useState(false);

	useEffect(() => {
		const media = window.matchMedia('(max-width: 700px)');
		let observer: IntersectionObserver | undefined;
		let frame = 0;
		let controller = createHeaderScrollController(window.scrollY);
		const element = header.current;

		const update = () => {
			frame = 0;
			if (!media.matches || !element) return;
			const focused = document.activeElement;
			const pinned =
				(element.contains(focused) &&
					focused instanceof Element &&
					focused.matches(':focus-visible, input, textarea, select')) ||
				Boolean(element.querySelector('details[open], [aria-expanded="true"]'));
			setCompact(
				controller.update(
					window.scrollY,
					Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
					pinned,
				),
			);
		};
		const scroll = () => {
			if (media.matches && !frame) frame = window.requestAnimationFrame(update);
		};
		const configure = () => {
			observer?.disconnect();
			controller = createHeaderScrollController(window.scrollY);
			if (media.matches) {
				update();
				return;
			}
			const target = pathname === '/' ? document.getElementById('homepage-search') : null;
			if (!target) {
				setCompact(pathname !== '/');
				return;
			}
			observer = new IntersectionObserver(
				([entry]) => setCompact(!entry.isIntersecting && entry.boundingClientRect.bottom < 80),
				{ rootMargin: '-80px 0px 0px 0px' },
			);
			observer.observe(target);
		};
		configure();
		media.addEventListener('change', configure);
		window.addEventListener('scroll', scroll, { passive: true });
		element?.addEventListener('focusin', update);
		return () => {
			observer?.disconnect();
			media.removeEventListener('change', configure);
			window.removeEventListener('scroll', scroll);
			element?.removeEventListener('focusin', update);
			window.cancelAnimationFrame(frame);
		};
	}, [pathname, route]);

	return { header, compact };
}
