// Turn an Apollo or network failure into a message a person can act on.
// Validation failures arrive as "Bad Request Exception" with the real reasons in originalError.
export function readableError(error: unknown): string {
	const failure = error as {
		message?: string;
		graphQLErrors?: Array<{ message?: string; extensions?: { originalError?: { message?: string | string[] } } }>;
		networkError?: { statusCode?: number } | null;
	};
	const entries = failure?.graphQLErrors || [];
	const all = [failure?.message, ...entries.map((entry) => entry.message)].join(' ');
	if (failure?.networkError?.statusCode === 429 || /too many requests/i.test(all))
		return 'Too many attempts. Please wait a minute and try again.';
	for (const entry of entries) {
		const detail = entry.extensions?.originalError?.message;
		const first = Array.isArray(detail) ? detail.find((item) => typeof item === 'string') : detail;
		if (typeof first === 'string' && first && !/exception/i.test(first)) return first;
		if (entry.message && !/exception/i.test(entry.message)) return entry.message;
	}
	if (failure?.networkError || /failed to fetch|network ?error|load failed/i.test(all))
		return 'We could not reach CreatorHub. Check your connection and try again.';
	if (!failure?.message || /exception/i.test(failure.message)) return 'Check the highlighted fields and try again.';
	return failure.message;
}
