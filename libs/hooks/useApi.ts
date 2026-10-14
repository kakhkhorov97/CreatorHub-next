import { useApolloClient, useQuery } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import * as adminMutations from '../../apollo/admin/mutation';
import * as adminQueries from '../../apollo/admin/query';
import * as mutations from '../../apollo/user/mutation';
import * as queries from '../../apollo/user/query';
import { retrySeconds } from '../auth/socialChallenge';
import { Operations } from '../types/creatorhub';
export const documents = { ...queries, ...mutations, ...adminQueries, ...adminMutations };

export type QueryName = keyof typeof queries | keyof typeof adminQueries;

export type MutationName = keyof typeof mutations | keyof typeof adminMutations;

export type ApiValue<T> = T extends { list: infer L } ? L : T;

export function unwrap<T>(value: T): ApiValue<T> {
	return (
		value && typeof value === 'object' && 'list' in value ? (value as unknown as { list: unknown }).list : value
	) as ApiValue<T>;
}

export function useApi<K extends QueryName>(
	name: K,
	variables: Operations[K]['variables'] = {} as Operations[K]['variables'],
	skip = false,
	pollInterval = 0,
) {
	const result = useQuery<Record<K, Operations[K]['result']>>(documents[name], {
		variables,
		skip,
		pollInterval,
		notifyOnNetworkStatusChange: true,
	});
	// Keep showing cached data while Apollo refreshes it in the background; only report loading when nothing is on screen.
	return { ...result, loading: result.loading && !result.data, value: result.data ? unwrap(result.data[name]) : undefined };
}

export function useAction() {
	const client = useApolloClient();
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const lock = useRef(false);
	const [retryUntil, setRetryUntil] = useState(0);
	const [retryAfter, setRetryAfter] = useState(0);
	useEffect(() => {
		if (!retryUntil) return;
		const update = () => {
			const remaining = Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000));
			setRetryAfter(remaining);
			if (!remaining) setRetryUntil(0);
		};
		update();
		const timer = window.setInterval(update, 1000);
		return () => window.clearInterval(timer);
	}, [retryUntil]);

	async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
		if (lock.current || retryUntil > Date.now()) return;
		lock.current = true;
		setBusy(true);
		setError('');
		try {
			return await action();
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Something went wrong. Please try again.';
			setError(message);
			const seconds = retrySeconds(e);
			if (seconds) {
				setRetryUntil(Date.now() + seconds * 1000);
				setRetryAfter(seconds);
			}
			return undefined;
		} finally {
			lock.current = false;
			setBusy(false);
		}
	}

	async function mutate<K extends MutationName>(
		name: K,
		variables: Operations[K]['variables'] = {} as Operations[K]['variables'],
	): Promise<Operations[K]['result']> {
		const result = await client.mutate<Record<K, Operations[K]['result']>>({ mutation: documents[name], variables });
		return result.data![name];
	}
	return { run, mutate, busy, error, setError, client, retryAfter };
}
