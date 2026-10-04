import { useEffect, useState } from 'react';
import { Operations } from '../types/creatorhub';
import { ApiValue, QueryName, useApi } from './useApi';

export function usePaged<K extends QueryName>(
	name: K,
	variables: Operations[K]['variables'],
	skip = false,
	limit = 12,
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
	);
	const rows = (Array.isArray(result.value) ? result.value : []) as ApiValue<Operations[K]['result']> extends Array<
		infer T
	>
		? T[]
		: never[];
	return {
		...result,
		rows,
		offset,
		next: () => setOffset((n) => n + limit),
		previous: () => setOffset((n) => Math.max(0, n - limit)),
		canNext: rows.length === limit,
	};
}
