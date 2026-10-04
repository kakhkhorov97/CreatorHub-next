import { useApolloClient } from '@apollo/client';
import { useEffect, useState } from 'react';
import { CreatorProfile } from '../types/creatorhub';
import { documents, unwrap } from './useApi';
// The backend exposes profiles by slug, but project/follow records contain IDs.
// Resolve only visible profiles through paginated discovery; never fabricate an identity.

export function useCreatorDirectory(ids: string[]) {
	const client = useApolloClient();
	const [creators, setCreators] = useState<Record<string, CreatorProfile>>({});
	const key = Array.from(new Set(ids)).sort().join(',');
	useEffect(() => {
		let cancelled = false;
		if (!key) return;
		const wanted = new Set(key.split(','));
		(async () => {
			const found: Record<string, CreatorProfile> = {};
			for (let offset = 0; offset <= 10000 && wanted.size; offset += 50) {
				const result = await client.query<{ getCreators: { list: CreatorProfile[] } }>({
					query: documents.getCreators,
					variables: { input: { page: Math.floor(offset / 50) + 1, limit: 50 } },
					fetchPolicy: 'cache-first',
				});
				if (cancelled) return;
				for (const creator of unwrap(result.data.getCreators))
					if (wanted.has(creator._id)) {
						found[creator._id] = creator;
						wanted.delete(creator._id);
					}
				setCreators({ ...found });
				if (unwrap(result.data.getCreators).length < 50) break;
			}
		})().catch(() => {
			/* Main query owns the error; unavailable profiles remain unnamed. */
		});
		return () => {
			cancelled = true;
		};
	}, [client, key]);
	return creators;
}
