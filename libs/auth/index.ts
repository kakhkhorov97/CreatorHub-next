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

export async function accessToken(): Promise<string | null> {
	const session = readSession();
	if (!session) return null;
	if (session.expiresAt > Date.now() + 30000) return session.accessToken;
	if (!refreshPending)
		refreshPending = (async () => {
			// Single flight prevents rotating the same refresh token twice in one tab.
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					query:
						'mutation refreshSession($refreshToken: String!) { refreshSession(refreshToken: $refreshToken) { accessToken refreshToken expiresIn user { _id createdAt updatedAt displayName avatarUrl role status preferredLocale } } }',
					variables: { refreshToken: session.refreshToken },
				}),
			});
			const body = await response.json();
			if (!response.ok || body.errors || !body.data?.refreshSession) {
				clearSession();
				throw new Error('Your session expired. Please sign in again.');
			}
			// A request already in flight must not restore a session after sign out.
			if (current?.refreshToken !== session.refreshToken) return null;
			saveSession(body.data.refreshSession);
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
	return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.includes('\\')
		? value
		: '/workspace';
}
