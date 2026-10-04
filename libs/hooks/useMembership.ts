import { useApolloClient, useReactiveVar } from '@apollo/client';
import { useEffect, useState } from 'react';
import { userVar } from '../../apollo/store';
import { documents, unwrap } from './useApi';

export function useMembership(kind: 'saved' | 'following', id: string) {
	const client = useApolloClient();
	const user = useReactiveVar(userVar);
	const [active, setActive] = useState(false);
	const [loading, setLoading] = useState(false);
	useEffect(() => {
		let cancelled = false;
		setActive(false);
		if (!user || !id) return;
		setLoading(true);
		(async () => {
			const name = kind === 'saved' ? 'getSavedProjects' : 'getMyFollows';
			for (let offset = 0; offset <= 10000; offset += 50) {
				const result = await client.query({
					query: documents[name],
					variables: { input: { page: Math.floor(offset / 50) + 1, limit: 50 } },
					fetchPolicy: 'cache-first',
				});
				if (cancelled) return;
				const rows = unwrap(result.data[name]) as Array<{ projectId?: string; creatorId?: string; isActive?: boolean }>;
				if (rows.some((row) => (kind === 'saved' ? row.projectId === id : row.creatorId === id && row.isActive))) {
					setActive(true);
					return;
				}
				if (rows.length < 50) return;
			}
		})()
			.catch(() => {})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [client, user?._id, kind, id]);
	return { active, setActive, loading };
}
