import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import { print } from 'graphql';
import { creator, getEvent, getProject, getService } from '../../apollo/user/query';
import type { Operations } from '../types/creatorhub';
import type { PageMetadata } from '../seo/metadata';

export interface SocialPageProps {
	seo: PageMetadata;
}
type Kind = 'project' | 'creator' | 'service' | 'event';
const queries = { creator, getEvent, getProject, getService };

async function publicQuery<K extends keyof typeof queries>(name: K, variables: Operations[K]['variables']) {
	const response = await fetch(
		process.env.API_GRAPHQL_URL || process.env.NEXT_PUBLIC_API_GRAPHQL_URL || 'http://localhost:7001/graphql',
		{
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'Apollo-Require-Preflight': 'true' },
			body: JSON.stringify({ query: print(queries[name]), variables }),
			signal: AbortSignal.timeout(5000),
		},
	);
	if (!response.ok) throw new Error('Public metadata request failed.');
	const result = (await response.json()) as {
		data?: Partial<{ [P in K]: Operations[P]['result'] | null }>;
		errors?: { extensions?: { code?: string; originalError?: { statusCode?: number } } }[];
	};
	if (result.errors?.length) {
		if (
			result.errors.every(
				(error) => error.extensions?.code === 'NOT_FOUND' || error.extensions?.originalError?.statusCode === 404,
			)
		)
			return null;
		throw new Error('Public metadata query failed.');
	}
	if (!result.data || !(name in result.data)) throw new Error('Missing public metadata response.');
	return result.data[name] || null;
}

export function socialPageProps(kind: Kind) {
	return async (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<SocialPageProps>> => {
		const identifier = context.params?.[kind === 'creator' ? 'slug' : 'id'];
		if (typeof identifier !== 'string' || !identifier) return { notFound: true };
		// Clicks inside the site already render the title from client data; preview tags only matter on a full page load.
		if (context.req.headers['x-nextjs-data'] || context.req.url?.startsWith('/_next/data/')) return { props: { seo: {} } };
		let seo: PageMetadata;
		try {
			if (kind === 'project') {
				const project = await publicQuery('getProject', { projectId: identifier });
				if (!project) return { notFound: true };
				seo = {
					title: project.title,
					description: project.summary || project.description || undefined,
					image: project.coverImageUrl || undefined,
					imageAlt: project.title,
				};
			} else if (kind === 'creator') {
				const profile = await publicQuery('creator', { slug: identifier });
				if (!profile) return { notFound: true };
				seo = {
					title: profile.identity.displayName,
					description: profile.bio || profile.headline || undefined,
					image: profile.identity.avatarUrl || undefined,
					imageAlt: profile.identity.displayName,
				};
			} else if (kind === 'service') {
				const service = await publicQuery('getService', { serviceId: identifier });
				if (!service) return { notFound: true };
				seo = { title: service.title, description: service.description || undefined };
			} else {
				const event = await publicQuery('getEvent', { id: identifier });
				if (!event) return { notFound: true };
				seo = {
					title: event.title,
					description: `${event.isDemo ? 'Fictional event concept. ' : ''}${event.description || ''}`,
				};
			}
		} catch {
			// Keep the page recoverable in the browser without caching an inaccurate preview as a successful response.
			context.res.statusCode = 503;
			context.res.setHeader('Retry-After', '60');
			seo = { noindex: true };
		}
		return { props: { seo: Object.fromEntries(Object.entries(seo).filter(([, value]) => value !== undefined)) } };
	};
}
