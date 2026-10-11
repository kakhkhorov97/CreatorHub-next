import { useEffect, useRef, useState } from 'react';

export function createHeaderScrollController(initialY = 0) {
	let previousY = Math.max(0, initialY);
	let turnY = previousY;
	let direction = 0;
	let hidden = false;

	return {
		update(rawY: number, maximumY: number, headerHeight: number, pinned = false) {
			// Safari can report positions outside the document during elastic scrolling.
			if (!Number.isFinite(rawY) || rawY > maximumY) return hidden;
			const y = Math.max(0, rawY);
			if (pinned || y <= 24) {
				previousY = turnY = y;
				direction = 0;
				hidden = false;
				return hidden;
			}
			const delta = y - previousY;
			if (delta === 0) return hidden;
			const nextDirection = delta > 0 ? 1 : -1;
			if (nextDirection !== direction) {
				direction = nextDirection;
				turnY = previousY;
			}
			previousY = y;
			const distance = Math.abs(y - turnY);
			if (direction === 1 && distance >= 16 && y > headerHeight) hidden = true;
			if (direction === -1 && distance >= 12) hidden = false;
			return hidden;
		},
	};
}

export default function useHeaderScroll(pathname: string, route: string) {
	const header = useRef<HTMLDivElement>(null);
	const [compact, setCompact] = useState(false);
	const [hidden, setHidden] = useState(false);

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
			setHidden(
				controller.update(
					window.scrollY,
					Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
					element.offsetHeight,
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
			setHidden(false);
			if (media.matches) {
				setCompact(false);
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

	return { header, compact, hidden };
}
