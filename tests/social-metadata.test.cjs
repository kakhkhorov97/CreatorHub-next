const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, extras = {}) {
	const context = {
		exports: {},
		URL,
		AbortSignal,
		process: { env: { NODE_ENV: 'production', NEXT_PUBLIC_SITE_URL: 'https://creatorhub.test' } },
		require,
		...extras,
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync(file, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
		}).outputText,
		context,
	);
	return context.exports;
}
const metadata = load('libs/seo/metadata.ts');

test('canonical URLs strip query secrets and preserve localized paths', () => {
	assert.equal(
		metadata.canonicalUrl('/projects/123?token=secret#section', 'ko'),
		'https://creatorhub.test/ko/projects/123',
	);
	assert.equal(metadata.canonicalUrl('/ko/projects/123', 'ko'), 'https://creatorhub.test/ko/projects/123');
	assert.equal(metadata.canonicalUrl('/', 'en'), 'https://creatorhub.test/');
	assert.equal(metadata.canonicalUrl('//another.test'), undefined);
	assert.equal(metadata.imageUrl('/demo-media/example.png'), 'https://creatorhub.test/demo-media/example.png');
	assert.equal(metadata.imageUrl('javascript:alert(1)'), undefined);
	assert.equal(metadata.imageUrl('https://user:pass@example.test/image.png'), undefined);
	const unconfigured = load('libs/seo/metadata.ts', { process: { env: { NODE_ENV: 'production' } } });
	assert.equal(unconfigured.canonicalUrl('/'), undefined);
	assert.equal(unconfigured.imageUrl('/brand/social-preview.png'), undefined);
});

test('server-rendered head includes an absolute default card, localized canonical and escaped text', () => {
	const Seo = load('libs/components/common/Seo.tsx', {
		require(name) {
			if (name === 'next/head') return { default: ({ children }) => React.createElement('head', null, children) };
			if (name === 'next/router')
				return { useRouter: () => ({ asPath: '/projects?token=secret', locale: 'ko', defaultLocale: 'en' }) };
			if (name === '../../seo/metadata') return metadata;
			return require(name);
		},
	}).default;
	const html = renderToStaticMarkup(React.createElement(Seo, { title: 'Work <&>', description: 'A\nproject' }));
	assert.match(html, /property="og:image" content="https:\/\/creatorhub.test\/brand\/social-preview.png"/);
	assert.match(html, /property="og:image:width" content="1200"/);
	assert.match(html, /name="twitter:card" content="summary_large_image"/);
	assert.match(html, /rel="canonical" href="https:\/\/creatorhub.test\/ko\/projects"/);
	assert.match(html, /Work &lt;&amp;&gt; \| CreatorHub/);
	assert.equal(html.includes('secret'), false);
	const custom = renderToStaticMarkup(React.createElement(Seo, { title: 'Work', image: '/demo-media/art.png' }));
	assert.match(custom, /property="og:image" content="https:\/\/creatorhub.test\/demo-media\/art.png"/);
	assert.equal(custom.includes('og:image:width'), false);
});

function server(fetch) {
	return load('libs/server/socialMetadata.ts', {
		fetch,
		require(name) {
			if (name === '../../apollo/user/query')
				return Object.fromEntries(
					['creator', 'getProject', 'getService', 'getEvent'].map((name) => [
						name,
						require('graphql').parse(`query ${name} { ${name} }`),
					]),
				);
			return require(name);
		},
	});
}
function context(params = { id: '123' }) {
	return {
		params,
		req: { headers: { cookie: 'private-session', authorization: 'secret' } },
		res: {
			statusCode: 200,
			setHeader(name, value) {
				this[name] = value;
			},
		},
	};
}

test('public records produce serializable metadata without forwarding visitor credentials', async () => {
	const fixtures = {
		getProject: { title: 'Project title', summary: 'Project summary', coverImageUrl: '/demo-media/art.png' },
		creator: { identity: { displayName: 'Creator name', avatarUrl: null }, headline: 'Designer', bio: null },
		getService: { title: 'Service title', description: 'Service description' },
		getEvent: { title: 'Event title', description: 'Event description', isDemo: true },
	};
	const module = server(async (url, options) => {
		assert.equal(options.headers.Authorization, undefined);
		assert.equal(options.headers.cookie, undefined);
		assert.equal(JSON.stringify(options).includes('secret'), false);
		const body = JSON.parse(options.body);
		const operation = body.query.match(/query (\w+)/)[1];
		assert.ok(options.signal instanceof AbortSignal);
		return { ok: true, json: async () => ({ data: { [operation]: fixtures[operation] } }) };
	});
	for (const [kind, title] of [
		['project', 'Project title'],
		['creator', 'Creator name'],
		['service', 'Service title'],
		['event', 'Event title'],
	]) {
		const result = await module.socialPageProps(kind)(
			context(kind === 'creator' ? { slug: 'designer' } : { id: '123' }),
		);
		assert.equal(result.props.seo.title, title);
		assert.equal(Object.values(result.props.seo).includes(undefined), false);
		if (kind === 'event') assert.match(result.props.seo.description, /^Fictional event concept\./);
	}
});

test('missing records return 404, while API failures remain retryable', async () => {
	const missing = server(async () => ({ ok: true, json: async () => ({ data: { getProject: null } }) }));
	assert.equal((await missing.socialPageProps('project')(context())).notFound, true);
	const backendNotFound = server(async () => ({
		ok: true,
		json: async () => ({
			data: null,
			errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: { statusCode: 404 } } }],
		}),
	}));
	assert.equal((await backendNotFound.socialPageProps('project')(context())).notFound, true);
	const failure = server(async () => {
		throw new Error('Offline');
	});
	const ctx = context();
	const result = await failure.socialPageProps('project')(ctx);
	assert.equal(ctx.res.statusCode, 503);
	assert.equal(ctx.res['Retry-After'], '60');
	assert.equal(result.props.seo.noindex, true);
});
