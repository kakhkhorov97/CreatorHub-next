import { useRouter } from 'next/router';
import { MouseEvent } from 'react';

export function useCardNavigation(href: string) {
	const router = useRouter();
	return (event: MouseEvent<HTMLElement>) => {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		)
			return;
		if (
			(event.target as HTMLElement).closest('a, button, input, select, textarea, summary') ||
			window.getSelection()?.toString()
		)
			return;
		router.push(href);
	};
}
