export const label = (value?: string | null) =>
	value
		? value
				.toLowerCase()
				.replace(/_/g, ' ')
				.replace(/^./, (c) => c.toUpperCase())
		: '—';

export const money = (value?: number | null) =>
	value == null
		? 'Custom quote'
		: new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(value);

export const date = (value?: string | null) =>
	value
		? new Date(value).toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				timeZone: 'Asia/Seoul',
		  })
		: '—';

export function safeUrl(value?: string | null) {
	if (!value) return undefined;
	try {
		const url = new URL(value);
		const endpoint = new URL(process.env.NEXT_PUBLIC_API_GRAPHQL_URL || 'http://localhost:7001/graphql');
		const localUpload =
			['localhost', '127.0.0.1'].includes(endpoint.hostname) &&
			url.origin === endpoint.origin &&
			/^\/uploads\//.test(url.pathname);
		return (url.protocol === 'https:' || localUpload) && !url.username && !url.password ? value : undefined;
	} catch {
		return undefined;
	}
}

export function values(form: HTMLFormElement) {
	return Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
}

export function optional(value?: string) {
	return value?.trim() || undefined;
}

export function lines(value: string) {
	return value
		.split('\n')
		.map((v) => v.trim())
		.filter(Boolean);
}
