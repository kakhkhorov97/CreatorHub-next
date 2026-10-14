/** @type {import('next').NextConfig} */
const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_GRAPHQL_URL || 'http://localhost:7001/graphql').origin;

module.exports = {
	reactStrictMode: true,
	i18n: require('./next-i18next.config').i18n,
	poweredByHeader: false,
	// Resize stored images (libs/utils/image.ts). Only the API's demo files and uploads are allowed.
	images: {
		formats: ['image/webp'],
		minimumCacheTTL: 60 * 60 * 24 * 7,
		localPatterns: [{ pathname: '/demo-media/**' }, { pathname: '/concepts/**' }],
		remotePatterns: ['/demo-media/**', '/uploads/**'].map((pathname) => {
			const url = new URL(apiOrigin);
			return { protocol: url.protocol.replace(':', ''), hostname: url.hostname, port: url.port, pathname };
		}),
	},
	async rewrites() {
		return {
			beforeFiles: [{ source: '/demo-media/:asset*', destination: `${apiOrigin}/demo-media/:asset*` }],
			afterFiles: [],
			fallback: [],
		};
	},
};
