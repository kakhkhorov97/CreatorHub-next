import { makeVar, useApolloClient, useReactiveVar } from '@apollo/client';
import { useEffect } from 'react';
import { userVar } from '../../apollo/store';
import { Operations } from '../types/creatorhub';
import { documents, unwrap } from './useApi';

// Projects have no "saved by me" field, so every card would start as unsaved.
// The signed-in user's saved list is loaded once (50 per page, the API maximum)
// and shared by all cards; saving or unsaving updates it straight away.
const savedIdsVar = makeVar<Set<string> | null>(null);
let loadedFor: string | null = null;

export function useSavedProjectIds() {
	const client = useApolloClient();
	const user = useReactiveVar(userVar);
	const ids = useReactiveVar(savedIdsVar);
	useEffect(() => {
		if (!user) {
			loadedFor = null;
			if (savedIdsVar()) savedIdsVar(null);
			return;
		}
		if (loadedFor === user._id) return;
		loadedFor = user._id;
		(async () => {
			const found = new Set<string>();
			for (let page = 1; page <= 200; page++) {
				const result = await client.query<{ getSavedProjects: Operations['getSavedProjects']['result'] }>({
					query: documents.getSavedProjects,
					variables: { input: { page, limit: 50 } },
					fetchPolicy: 'network-only',
				});
				const rows = unwrap(result.data.getSavedProjects);
				rows.forEach((row) => found.add(row.projectId));
				if (rows.length < 50) break;
			}
			if (loadedFor === user._id) savedIdsVar(found);
		})().catch(() => {
			// Leave cards unmarked and try again on the next page that shows them.
			loadedFor = null;
		});
	}, [client, user]);
	return ids;
}

export function markProjectSaved(projectId: string, saved: boolean) {
	const next = new Set(savedIdsVar() ?? []);
	if (saved) next.add(projectId);
	else next.delete(projectId);
	savedIdsVar(next);
}
