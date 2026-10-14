import { useApolloClient } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import { CreatorService } from '../types/creatorhub';
import { documents } from './useApi';
// Inquiries carry a serviceId, not the service record, and there is no bulk lookup.
// Resolve one service at a time through the cache, a few at a time so a long inbox
// does not open twenty requests at once. getService only returns active services,
// so a paused or removed one is remembered as missing and never asked for again.

export function useServiceDirectory(ids: (string | null | undefined)[]) {
	const client = useApolloClient();
	const [services, setServices] = useState<Record<string, CreatorService>>({});
	const missing = useRef(new Set<string>());
	const key = Array.from(new Set(ids.filter((id): id is string => Boolean(id))))
		.sort()
		.join(',');
	useEffect(() => {
		if (!key) return;
		let cancelled = false;
		const wanted = key.split(',').filter((id) => !missing.current.has(id));
		(async () => {
			for (let index = 0; index < wanted.length && !cancelled; index += 4) {
				await Promise.all(
					wanted.slice(index, index + 4).map(async (id) => {
						try {
							const result = await client.query<{ getService: CreatorService }>({
								query: documents.getService,
								variables: { serviceId: id },
								fetchPolicy: 'cache-first',
							});
							if (!cancelled) setServices((previous) => ({ ...previous, [id]: result.data.getService }));
						} catch {
							// The service is no longer public. The conversation keeps its own snapshot.
							missing.current.add(id);
						}
					}),
				);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [client, key]);
	return services;
}
