type Provider = 'GOOGLE' | 'TELEGRAM';
const pending = new Map<Provider, Promise<string>>();
const lifetime = 8 * 60 * 1000;
const key = (provider: Provider) => `creatorhub.challenge.${provider}`;

export async function getSocialChallenge(provider: Provider, load: () => Promise<string>): Promise<string> {
	try {
		const saved = JSON.parse(sessionStorage.getItem(key(provider)) || 'null');
		if (
			typeof saved?.nonce === 'string' &&
			/^[a-f0-9]{64}$/i.test(saved.nonce) &&
			saved.expires > Date.now() &&
			saved.expires <= Date.now() + lifetime
		)
			return saved.nonce;
	} catch {
		/* Storage can be unavailable in private browsing. */
	}
	const existing = pending.get(provider);
	if (existing) return existing;
	const request = load()
		.then((nonce) => {
			try {
				sessionStorage.setItem(key(provider), JSON.stringify({ nonce, expires: Date.now() + lifetime }));
			} catch {}
			return nonce;
		})
		.finally(() => pending.delete(provider));
	pending.set(provider, request);
	return request;
}

export function discardSocialChallenge(provider: Provider) {
	try {
		sessionStorage.removeItem(key(provider));
	} catch {}
}

export function retrySeconds(error: unknown): number {
	const failure = error as {
		graphQLErrors?: Array<{
			extensions?: {
				originalError?: { retryAfterSeconds?: number; statusCode?: number };
				code?: string;
				status?: number;
			};
		}>;
		networkError?: { statusCode?: number };
		message?: string;
	};
	for (const entry of failure?.graphQLErrors || []) {
		const original = entry.extensions?.originalError;
		if (typeof original?.retryAfterSeconds === 'number' && Number.isFinite(original.retryAfterSeconds))
			return Math.min(60, Math.max(1, Math.ceil(original.retryAfterSeconds)));
		if (
			original?.statusCode === 429 ||
			entry.extensions?.status === 429 ||
			entry.extensions?.code === 'TOO_MANY_REQUESTS'
		)
			return 60;
	}
	return failure?.networkError?.statusCode === 429 || /Too many requests/i.test(failure?.message || '') ? 60 : 0;
}
