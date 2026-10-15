import Router, { useRouter } from 'next/router';
import { useCallback, useMemo } from 'react';
import { DiscoveryInput } from '../types/creatorhub';

// Discovery search state lives in the URL (?query=&categoryId=&city=&remote=1&budgetMax=&page=),
// so Back from a project returns to the same results and page, and links can be shared.
// URL updates use replace, so typing a new search does not add extra history entries.
const keys = ['query', 'categoryId', 'city', 'remote', 'budgetMax', 'page'] as const;

function text(value: string | string[] | undefined) {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function replaceQuery(changes: Record<string, string | undefined>) {
	// Router.query is always the current URL; a value captured during render may be stale.
	const query: Record<string, string | string[]> = {};
	for (const [key, value] of Object.entries({ ...Router.query, ...changes }))
		if (value !== undefined && value !== '') query[key] = value as string | string[];
	const same = (keys as readonly string[]).every((key) => Router.query[key] === query[key]);
	if (same) return;
	void Router.replace({ pathname: Router.pathname, query }, undefined, { shallow: true, scroll: false });
}

export function hasDiscoveryFilters(filters: DiscoveryInput) {
	return Boolean(
		filters.query || filters.categoryId || filters.city || filters.remoteAvailable || filters.budgetMax != null,
	);
}

export function useDiscoveryFilters() {
	const router = useRouter();
	const { query, categoryId, city, remote, budgetMax, page } = router.query;
	const filters = useMemo<DiscoveryInput>(() => {
		const budget = Number(text(budgetMax));
		return {
			query: text(query),
			categoryId: text(categoryId),
			city: text(city),
			remoteAvailable: remote === '1' ? true : undefined,
			budgetMax: Number.isInteger(budget) && budget >= 0 ? budget : undefined,
		};
	}, [query, categoryId, city, remote, budgetMax]);
	const currentPage = Math.max(1, Math.floor(Number(text(page)) || 1));
	const setFilters = useCallback((next: DiscoveryInput) => {
		replaceQuery({
			query: next.query || undefined,
			categoryId: next.categoryId || undefined,
			city: next.city || undefined,
			remote: next.remoteAvailable ? '1' : undefined,
			budgetMax: next.budgetMax != null ? String(next.budgetMax) : undefined,
			page: undefined,
		});
	}, []);
	const setPage = useCallback((next: number) => replaceQuery({ page: next > 1 ? String(next) : undefined }), []);
	return { ready: router.isReady, filters, page: currentPage, setFilters, setPage };
}
