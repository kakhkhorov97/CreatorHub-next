import type { CaptureResult } from 'posthog-js';

const publicPages = new Set([
	'/',
	'/projects',
	'/projects/[id]',
	'/creators',
	'/creators/[slug]',
	'/services',
	'/services/[id]',
	'/events',
	'/events/[id]',
	'/about',
	'/contact',
	'/faq',
	'/help',
	'/privacy',
	'/terms',
]);

export function publicPageUrl(route: string, path: string, origin: string): string | null {
	if (!publicPages.has(route)) return null;
	try {
		const url = new URL(path, origin);
		if (url.origin !== origin) return null;
		return `${url.origin}${url.pathname}`;
	} catch {
		return null;
	}
}

// Keep an explicit property allowlist so SDK defaults cannot add query strings,
// referral URLs, person properties or private page content to analytics.
export function sanitizePageView(event: CaptureResult | null): CaptureResult | null {
	if (!event || event.event !== '$pageview') return null;
	const { token, distinct_id, $current_url, $lib, $lib_version } = event.properties;
	let url: URL;
	try {
		url = new URL($current_url);
	} catch {
		return null;
	}
	const path = url.pathname.replace(/^\/(en|ko|uz)(?=\/|$)/, '') || '/';
	if (!publicPages.has(path) && !/^\/(projects|creators|services|events)\/[^/]+\/?$/.test(path)) return null;
	return {
		uuid: event.uuid,
		event: '$pageview',
		timestamp: event.timestamp,
		properties: {
			token,
			distinct_id,
			$current_url: `${url.origin}${url.pathname}`,
			$pathname: url.pathname,
			$host: url.host,
			$lib,
			$lib_version,
			$process_person_profile: false,
			$ip: null,
			$geoip_disable: true,
		},
	};
}
