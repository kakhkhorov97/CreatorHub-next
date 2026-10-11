import { sessionReadyVar, userVar } from '../../apollo/store';
import { AuthPayload } from '../types/creatorhub';
const KEY = 'creatorhub.session';

type Session = { accessToken: string; refreshToken: string; expiresAt: number };
let current: Session | null = null;
let refreshPending: Promise<string | null> | null = null;

export function readSession() {
	if (!current && typeof window !== 'undefined') {
		try {
			current = JSON.parse(sessionStorage.getItem(KEY) || 'null');
		} catch {
			current = null;
		}
	}
	return current;
}

export function saveSession(payload: AuthPayload) {
	current = {
		accessToken: payload.accessToken,
		refreshToken: payload.refreshToken,
		expiresAt: Date.now() + payload.expiresIn * 1000,
	};
	if (typeof window !== 'undefined') sessionStorage.setItem(KEY, JSON.stringify(current));
	userVar(payload.user);
}

export function clearSession() {
	current = null;
	if (typeof window !== 'undefined') sessionStorage.removeItem(KEY);
	userVar(null);
}
export const endpoint = process.env.NEXT_PUBLIC_API_GRAPHQL_URL || 'http://localhost:7001/graphql';

type AuthenticationError = {
	extensions?: { code?: string; originalError?: { statusCode?: number } };
};

export function isAuthenticationError(error: unknown): boolean {
	const failure = error as { graphQLErrors?: AuthenticationError[]; networkError?: { statusCode?: number } } | null;
	return (
		[401, 403].includes(failure?.networkError?.statusCode || 0) ||
		Boolean(
			failure?.graphQLErrors?.some(
				(item) =>
					['UNAUTHENTICATED', 'FORBIDDEN'].includes(item.extensions?.code || '') ||
					[401, 403].includes(item.extensions?.originalError?.statusCode || 0),
			),
		)
	);
}

export async function accessToken(): Promise<string | null> {
	const session = readSession();
	if (!session) return null;
	if (session.expiresAt > Date.now() + 30000) return session.accessToken;
	if (!refreshPending)
		refreshPending = (async () => {
			// Single flight prevents rotating the same refresh token twice in one tab.
			let response: Response;
			try {
				response = await fetch(endpoint, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						query:
							'mutation refreshSession($refreshToken: String!) { refreshSession(refreshToken: $refreshToken) { accessToken refreshToken expiresIn user { _id createdAt updatedAt displayName avatarUrl role status preferredLocale } } }',
						variables: { refreshToken: session.refreshToken },
					}),
				});
			} catch {
				throw new Error('Unable to refresh your session. Check your connection and try again.');
			}
			if (response.status === 401 || response.status === 403) {
				if (current?.refreshToken === session.refreshToken) clearSession();
				throw new Error('Your session expired. Please sign in again.');
			}
			if (!response.ok) throw new Error('Unable to refresh your session. Please try again shortly.');
			let body;
			try {
				body = await response.json();
			} catch {
				throw new Error('Unable to refresh your session. Please try again shortly.');
			}
			if (isAuthenticationError({ graphQLErrors: body?.errors })) {
				if (current?.refreshToken === session.refreshToken) clearSession();
				throw new Error('Your session expired. Please sign in again.');
			}
			const payload = body?.data?.refreshSession;
			if (
				body?.errors?.length ||
				!payload?.accessToken ||
				!payload?.refreshToken ||
				!payload?.user?._id ||
				!Number.isFinite(payload.expiresIn) ||
				payload.expiresIn <= 0
			)
				throw new Error('Unable to refresh your session. Please try again shortly.');
			// A request already in flight must not restore a session after sign out.
			if (current?.refreshToken !== session.refreshToken) return null;
			saveSession(payload);
			return current!.accessToken;
		})().finally(() => {
			refreshPending = null;
		});
	return refreshPending;
}

export function finishSessionCheck() {
	sessionReadyVar(true);
}

export function safeReturnTo(value: unknown) {
	return typeof value === 'string' &&
		value.startsWith('/') &&
		!value.startsWith('//') &&
		!/[\u0000-\u0020\\]/.test(value)
		? value
		: '/';
}

export function authenticationDestination(
	returnTo: unknown,
	storedReturnTo: unknown,
	role: string,
	registering = false,
) {
	const resume = returnTo || (!registering ? storedReturnTo : undefined);
	return resume ? safeReturnTo(resume) : !registering && role === 'ADMIN' ? '/_admin' : '/';
}
