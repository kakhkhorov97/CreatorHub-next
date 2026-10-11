import { ApolloClient, ApolloLink, InMemoryCache, Observable } from '@apollo/client';
import { createUploadLink } from 'apollo-upload-client';
import { onError } from '@apollo/client/link/error';
import { useMemo } from 'react';
import { accessToken, clearSession, endpoint, readSession } from '../libs/auth';

function createClient() {
	const auth = new ApolloLink(
		(operation, forward) =>
			new Observable((observer) => {
				let subscription: ReturnType<ReturnType<typeof forward>['subscribe']> | undefined;
				let cancelled = false;
				accessToken()
					.then((token) => {
						if (cancelled) return;
						operation.setContext({
							creatorhubSessionId: readSession()?.sessionId,
							headers: token ? { Authorization: `Bearer ${token}` } : {},
						});
						subscription = forward(operation).subscribe(observer);
					})
					.catch((error) => observer.error(error));
				return () => {
					cancelled = true;
					subscription?.unsubscribe();
				};
			}),
	);
	const errors = onError(({ graphQLErrors, operation }) => {
		if (graphQLErrors?.some((error) => error.extensions?.code === 'UNAUTHENTICATED')) {
			const sessionId = operation.getContext().creatorhubSessionId;
			if (sessionId) clearSession(sessionId);
		}
	});
	return new ApolloClient({
		ssrMode: typeof window === 'undefined',
		link: ApolloLink.from([
			errors,
			auth,
			createUploadLink({ uri: endpoint, headers: { 'Apollo-Require-Preflight': 'true' } }),
		]),
		cache: new InMemoryCache({
			dataIdFromObject: (object) => (object._id ? `${object.__typename}:${object._id}` : undefined),
		}),
		defaultOptions: { watchQuery: { fetchPolicy: 'cache-and-network', notifyOnNetworkStatusChange: true } },
	});
}
let browserClient: ReturnType<typeof createClient> | undefined;

export function initializeApollo() {
	if (typeof window === 'undefined') return createClient();
	return browserClient ?? (browserClient = createClient());
}

export function useApollo() {
	return useMemo(initializeApollo, []);
}
