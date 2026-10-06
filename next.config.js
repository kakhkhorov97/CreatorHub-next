/** @type {import('next').NextConfig} */
const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_GRAPHQL_URL || 'http://localhost:7001/graphql').origin;

module.exports = {
	reactStrictMode: true,
	i18n: require('./next-i18next.config').i18n,
	poweredByHeader: false,
	async rewrites() {
		return {
			beforeFiles: [{ source: '/demo-media/:asset*', destination: `${apiOrigin}/demo-media/:asset*` }],
			afterFiles: [],
			fallback: [],
		};
	},
};
