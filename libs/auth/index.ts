import { SessionHint, sessionHintVar, sessionReadyVar, userVar } from '../../apollo/store';
import { AuthPayload } from '../types/creatorhub';
const KEY = 'creatorhub.session';

type Session = {
	accessToken: string;
	refreshToken: string;
	expiresAt: number;
	sessionId: string;
	// Display-only, so the header can show the account before `me` answers.
	hint?: SessionHint;
};
let current: Session | null = null;
let refreshPending: Promise<string | null> | null = null;

// A damaged hint must never invalidate working credentials, so it is validated apart.
function readHint(value: unknown): SessionHint | undefined {
	const hint = value as SessionHint | undefined;
	return hint && typeof hint.displayName === 'string' && typeof hint.role === 'string'
		? {
				displayName: hint.displayName,
				avatarUrl: typeof hint.avatarUrl === 'string' ? hint.avatarUrl : undefined,
				role: hint.role,
		  }
		: undefined;
}

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
				? { ...saved, hint: readHint(saved.hint) }
				: null;
	} catch {
		current = null;
	}
	return current;
}

function writeSession(payload: AuthPayload, sessionId: string) {
	const hint: SessionHint = {
		displayName: payload.user.displayName,
		avatarUrl: payload.user.avatarUrl ?? undefined,
		role: payload.user.role,
	};
	current = {
		accessToken: payload.accessToken,
		refreshToken: payload.refreshToken,
		expiresAt: Date.now() + payload.expiresIn * 1000,
		sessionId,
		hint,
	};
	if (typeof window !== 'undefined') localStorage.setItem(KEY, JSON.stringify(current));
	sessionHintVar(hint);
	userVar(payload.user);
}

/** Show the saved account in the header straight away, before `me` confirms it. */
export function publishSessionHint() {
	sessionHintVar(readSession()?.hint ?? null);
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
	sessionHintVar(null);
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
		sessionHintVar(null);
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
