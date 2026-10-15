import { Router } from 'next/router';
import { useEffect } from 'react';

// Back and Forward return to where the reader was; opening a new page still starts at the top.
// Each history entry has its own Next.js key, so positions never leak between pages.
// Lists render from Apollo's cache (cache-and-network) and keep their search and page in the URL,
// so the content is usually there at once; while it is still loading we wait for the page to grow.
const STORAGE_KEY = 'creatorhub.scroll-positions';
const MAX_ENTRIES = 50;
const MAX_WAIT_MS = 3000;
// Client-side page changes in this tab. A back control uses history only when it leads somewhere
// inside the site; a visitor who arrived directly follows the control's link instead.
let clientNavigations = 0;

export function hasInSiteHistory() {
	return clientNavigations > 0;
}

function entryKey() {
	const state = window.history.state as { key?: string } | null;
	return state?.key || window.location.pathname + window.location.search;
}

function readPositions(): Record<string, number> {
	try {
		return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || '{}');
	} catch {
		return {};
	}
}

function savePosition(key: string, y: number) {
	try {
		const positions = readPositions();
		delete positions[key];
		positions[key] = Math.round(y);
		const keys = Object.keys(positions);
		for (const old of keys.slice(0, Math.max(0, keys.length - MAX_ENTRIES))) delete positions[old];
		window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
	} catch {
		// Storage can be unavailable (private mode); restoration is a convenience only.
	}
}

export function useScrollRestoration(router: Router) {
	useEffect(() => {
		if (!('scrollRestoration' in window.history)) return;
		const previous = window.history.scrollRestoration;
		window.history.scrollRestoration = 'manual';
		// The browser swaps history.state before Next.js reports a popstate route change,
		// so remember which entry is on screen instead of reading it at navigation time.
		let current = entryKey();
		let lastY = window.scrollY;
		let popped = false;
		let stopRestore = () => {};

		const onScroll = () => {
			lastY = window.scrollY;
		};
		const onPopState = () => {
			popped = true;
		};
		const onStart = () => {
			stopRestore();
			savePosition(current, lastY);
		};
		const onComplete = () => {
			const key = entryKey();
			const shallowSamePage = key === current;
			current = key;
			if (!popped || shallowSamePage) {
				if (!popped && !shallowSamePage) clientNavigations++;
				popped = false;
				lastY = window.scrollY;
				return;
			}
			popped = false;
			const target = readPositions()[key];
			if (typeof target !== 'number' || target <= 0) return;
			restore(target);
		};
		const restore = (target: number) => {
			const started = performance.now();
			let frame = 0;
			const cancel = () => {
				window.cancelAnimationFrame(frame);
				for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'])
					window.removeEventListener(type, cancel, true);
			};
			stopRestore = cancel;
			// The reader's own scrolling wins over a pending restore.
			for (const type of ['wheel', 'touchstart', 'keydown', 'pointerdown'])
				window.addEventListener(type, cancel, { capture: true, passive: true });
			const step = () => {
				const reachable = document.documentElement.scrollHeight - window.innerHeight;
				const done = reachable >= target || performance.now() - started > MAX_WAIT_MS;
				window.scrollTo({ top: Math.min(target, Math.max(0, reachable)), behavior: 'auto' });
				lastY = window.scrollY;
				if (done) cancel();
				else frame = window.requestAnimationFrame(step);
			};
			step();
		};
		const onPageHide = () => savePosition(current, lastY);

		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('popstate', onPopState);
		window.addEventListener('pagehide', onPageHide);
		router.events.on('routeChangeStart', onStart);
		router.events.on('routeChangeComplete', onComplete);
		return () => {
			stopRestore();
			window.history.scrollRestoration = previous;
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('popstate', onPopState);
			window.removeEventListener('pagehide', onPageHide);
			router.events.off('routeChangeStart', onStart);
			router.events.off('routeChangeComplete', onComplete);
		};
	}, [router]);
}
