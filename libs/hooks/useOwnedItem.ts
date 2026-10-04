import { useApolloClient } from '@apollo/client';
import { useEffect, useState } from 'react';
import { CreatorService, PortfolioProject } from '../types/creatorhub';
import { documents, unwrap } from './useApi';

export function useOwnedItem(kind: 'project' | 'service', id: string) {
	const client = useApolloClient();
	const [value, setValue] = useState<PortfolioProject | CreatorService>();
	const [loading, setLoading] = useState(!!id);
	const [error, setError] = useState<Error>();
	useEffect(() => {
		let cancelled = false;
		setValue(undefined);
		setError(undefined);
		if (!id) {
			setLoading(false);
			return;
		}
		setLoading(true);
		(async () => {
			const name = kind === 'project' ? 'getMyProjects' : 'getMyServices';
			for (let offset = 0; offset <= 10000; offset += 50) {
				const result = await client.query({
					query: documents[name],
					variables: { input: { page: Math.floor(offset / 50) + 1, limit: 50 } },
					fetchPolicy: 'network-only',
				});
				if (cancelled) return;
				const rows = unwrap(result.data[name]) as Array<PortfolioProject | CreatorService>;
				const item = rows.find((row) => row._id === id);
				if (item) {
					setValue(item);
					return;
				}
				if (rows.length < 50) break;
			}
			throw new Error('This item is unavailable or does not belong to your account.');
		})()
			.catch((e) => {
				if (!cancelled) setError(e);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [client, kind, id]);
	return { value, loading, error };
}
