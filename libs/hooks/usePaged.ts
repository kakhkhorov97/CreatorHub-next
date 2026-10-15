import { useEffect, useRef, useState } from 'react';
import { useApolloClient } from '@apollo/client';
import { usePageAdvance } from './usePageAdvance';
import { Operations } from '../types/creatorhub';
import { ApiValue, QueryName, useApi, documents, unwrap } from './useApi';

export function usePaged<K extends QueryName>(
	name: K,
	variables: Operations[K]['variables'],
	skip = false,
	limit = 12,
	pollInterval = 0,
	// Optional URL-backed page (see useDiscoveryFilters): start on that page and report changes.
	page?: { initial: number; onChange: (page: number) => void },
) {
	const [offset, setOffset] = useState(() => Math.max(0, ((page?.initial || 1) - 1) * limit));
	const key = JSON.stringify(variables);
	const lastKey = useRef(key + name);
	useEffect(() => {
		// Only a real change of query starts again at page one; mounting keeps a restored page.
		if (lastKey.current === key + name) return;
		lastKey.current = key + name;
		setOffset(0);
	}, [key, name]);
	const reportedOffset = useRef(offset);
	const onPageChange = page?.onChange;
	useEffect(() => {
		if (reportedOffset.current === offset) return;
		reportedOffset.current = offset;
		onPageChange?.(Math.floor(offset / limit) + 1);
	}, [offset, limit, onPageChange]);
	const result = useApi(
		name,
		{
			...variables,
			input: { ...('input' in variables ? variables.input : {}), page: Math.floor(offset / limit) + 1, limit },
		} as Operations[K]['variables'],
		skip,
		pollInterval,
	);
	const rows = (Array.isArray(result.value) ? result.value : []) as ApiValue<Operations[K]['result']> extends Array<
		infer T
	>
		? T[]
		: never[];
	const client = useApolloClient();
	const pagination = usePageAdvance(JSON.stringify([name, key, offset, limit, skip]), async () => {
		if (skip) return false;
		const response = await client.query<Record<K, Operations[K]['result']>>({
			query: documents[name],
			variables: {
				...variables,
				input: { ...('input' in variables ? variables.input : {}), page: Math.floor(offset / limit) + 2, limit },
			},
			fetchPolicy: 'network-only',
		});
		const nextRows = unwrap(response.data[name]);
		if (!Array.isArray(nextRows)) throw new Error('Invalid page response');
		return nextRows.length > 0;
	}, () => setOffset((n) => n + limit));
	// Discovery lists also return metaCounter, the backend's count of every match (not just this page).
	const data = result.data?.[name] as unknown as { metaCounter?: Array<{ total: number }> } | undefined;
	const total = data && Array.isArray(data.metaCounter) ? data.metaCounter[0]?.total ?? 0 : undefined;
	return {
		...result,
		...pagination,
		total,
		loading: result.loading || pagination.checkingNext,
		rows,
		offset,
		previous: () => setOffset((n) => Math.max(0, n - limit)),
		canNext: !skip && rows.length === limit && !pagination.noMoreResults,
	};
}
