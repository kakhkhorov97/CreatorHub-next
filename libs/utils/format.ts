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

// Media that Picture accepts: a seeded demo file, or an https URL (plus local uploads in development).
export const mediaUrl = (value?: string | null) =>
	value && /^\/demo-media\/[a-z0-9-]+\.(?:svg|png|jpg|webp)$/.test(value) ? value : safeUrl(value);

// Inbox row stamp: the time today, the weekday within the past week, otherwise the date.
export function conversationTime(value: string | null | undefined, locale: string) {
	if (!value) return '';
	const moment = new Date(value);
	const days = Math.round((startOfDay(new Date()).getTime() - startOfDay(moment).getTime()) / 86400000);
	if (days <= 0) return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(moment);
	if (days < 7) return new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(moment);
	return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(moment);
}

function startOfDay(value: Date) {
	return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

// Day separators in a thread. The viewer's own day, so it matches the times on the messages.
export const dayKey = (value: string) => startOfDay(new Date(value)).toDateString();

export function dayLabel(value: string, locale: string) {
	const today = startOfDay(new Date());
	const key = dayKey(value);
	if (key === today.toDateString()) return 'today';
	if (key === new Date(today.getTime() - 86400000).toDateString()) return 'yesterday';
	return new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(value));
}
