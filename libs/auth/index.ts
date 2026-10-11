import { sessionReadyVar, userVar } from '../../apollo/store';
import { AuthPayload } from '../types/creatorhub';
const KEY = 'creatorhub.session';

type Session = { accessToken: string; refreshToken: string; expiresAt: number; sessionId: string };
let current: Session | null = null;
let refreshPending: Promise<string | null> | null = null;

export function readSession(): Session | null {
	if (typeof window === 'undefined') return null;
	try {
		// Retire per-tab credentials. Shared login starts with one fresh sign-in.
		sessionStorage.removeItem(KEY);
		const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
		current =
			saved &&
			typeof saved.accessToken === 'string' &&
			typeof saved.refreshToken === 'string' &&
			typeof saved.sessionId === 'string' &&
			Number.isFinite(saved.expiresAt)
				? saved
				: null;
	} catch {
		current = null;
	}
	return current;
}

function writeSession(payload: AuthPayload, sessionId: string) {
	current = {
		accessToken: payload.accessToken,
		refreshToken: payload.refreshToken,
		expiresAt: Date.now() + payload.expiresIn * 1000,
		sessionId,
	};
	if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(current));
	userVar(payload.user);
}

export function saveSession(payload: AuthPayload) {
	writeSession(payload, crypto.randomUUID());
}

export function clearSession(expectedSessionId?: string) {
	if (expectedSessionId && readSession()?.sessionId !== expectedSessionId) return;
	current = null;
	if (typeof window !== 'undefined') {
		localStorage.removeItem(KEY);
		sessionStorage.removeItem(KEY);
	}
	userVar(null);
}

export function watchSharedSession() {
	const changed = (event: StorageEvent) => {
		if (event.storageArea !== localStorage || (event.key !== KEY && event.key !== null)) return;
		let before: Session | null = null;
		try {
			before = JSON.parse(event.oldValue || 'null');
		} catch {}
		const after = readSession();
		if (event.key === KEY && before?.sessionId === after?.sessionId) return;
		// Reload clears private Apollo data and sockets before another account is shown.
		userVar(null);
		sessionReadyVar(false);
		window.location.reload();
	};
	window.addEventListener('storage', changed);
	return () => window.removeEventListener('storage', changed);
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
	const saved = readSession();
	if (!saved) return null;
	if (saved.expiresAt > Date.now() + 30000) return saved.accessToken;
	if (typeof navigator === 'undefined' || !navigator.locks)
		throw new Error('Secure session refresh is unavailable. Use HTTPS and a current browser.');
	if (!refreshPending)
		refreshPending = navigator.locks
			.request('creatorhub.session.refresh', async () => {
				const session = readSession();
				if (!session || session.sessionId !== saved.sessionId) return null;
				if (session.expiresAt > Date.now() + 30000) return session.accessToken;
				// The browser lock prevents rotation races across tabs.
				let response: Response;
				try {
					response = await fetch(endpoint, {
						method: 'POST',
						signal: AbortSignal.timeout(10000),
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
					if (readSession()?.refreshToken === session.refreshToken) clearSession();
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
					if (readSession()?.refreshToken === session.refreshToken) clearSession();
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
				if (readSession()?.refreshToken !== session.refreshToken) return null;
				writeSession(payload, session.sessionId);
				return current!.accessToken;
			})
			.then((token) => token)
			.finally(() => {
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
