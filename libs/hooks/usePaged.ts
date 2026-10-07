import { useEffect, useState } from 'react';
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
) {
	const [offset, setOffset] = useState(0);
	const key = JSON.stringify(variables);
	useEffect(() => setOffset(0), [key, name]);
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
	return {
		...result,
		...pagination,
		loading: result.loading || pagination.checkingNext,
		rows,
		offset,
		previous: () => setOffset((n) => Math.max(0, n - limit)),
		canNext: !skip && rows.length === limit && !pagination.noMoreResults,
	};
}
