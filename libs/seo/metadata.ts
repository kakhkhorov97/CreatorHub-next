export const defaultDescription =
	'Explore creative work, discover creators and services, and start a private project inquiry.';
export const defaultImage = '/brand/social-preview.png';

export interface PageMetadata {
	title?: string;
	description?: string;
	image?: string;
	imageAlt?: string;
	noindex?: boolean;
}

export function siteOrigin() {
	const value =
		process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV !== 'production' ? 'http://localhost:7007' : undefined);
	if (!value) return undefined;
	const url = new URL(value);
	if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
		throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) website URL without credentials.');
	return url.origin;
}

export function canonicalUrl(path: string, locale?: string, defaultLocale = 'en') {
	const origin = siteOrigin();
	if (!origin) return undefined;
	const pathname = path.split(/[?#]/)[0];
	if (!pathname.startsWith('/') || pathname.startsWith('//')) return undefined;
	const prefix = locale && locale !== defaultLocale ? `/${locale}` : '';
	const localized =
		prefix && pathname !== prefix && !pathname.startsWith(`${prefix}/`)
			? `${prefix}${pathname === '/' ? '' : pathname}`
			: pathname;
	return new URL(localized, origin).href;
}

export function imageUrl(value?: string) {
	const origin = siteOrigin();
	if (!value || (!origin && !/^https?:\/\//.test(value))) return undefined;
	try {
		const url = new URL(value, origin);
		if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return undefined;
		return url.href;
	} catch {
		return undefined;
	}
}

export function descriptionText(value: string) {
	return value.replace(/\s+/g, ' ').trim().slice(0, 200);
}
