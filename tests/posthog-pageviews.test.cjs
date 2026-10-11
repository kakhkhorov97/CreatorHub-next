const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(file, requireMock, extras = {}) {
	const context = { exports: {}, URL, require: requireMock, ...extras };
	const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
	}).outputText;
	vm.runInNewContext(source, context);
	return context.exports;
}
const policy = load('libs/analytics/pageViews.ts');

test('tracks only public routes and removes queries and fragments', () => {
	assert.equal(
		policy.publicPageUrl('/projects', '/projects?search=private#result', 'https://creatorhub.test'),
		'https://creatorhub.test/projects',
	);
	assert.equal(
		policy.publicPageUrl('/creators/[slug]', '/ko/creators/example', 'https://creatorhub.test'),
		'https://creatorhub.test/ko/creators/example',
	);
	for (const path of [
		'/account/sign-in',
		'/account/reset-password',
		'/reset-password',
		'/verify-email',
		'/_admin',
		'/inquiries/123',
		'/workspace',
		'/notifications',
		'/saved',
		'/following',
		'/api/chat',
	]) {
		assert.equal(policy.publicPageUrl(path, `${path}?token=secret`, 'https://creatorhub.test'), null);
	}
	assert.equal(policy.publicPageUrl('/', 'https://elsewhere.test/', 'https://creatorhub.test'), null);
});

test('final event filter removes identifiers, referrers, form values and SDK-added properties', () => {
	const event = policy.sanitizePageView({
		uuid: 'fixture-event',
		event: '$pageview',
		properties: {
			token: 'test-project-token',
			distinct_id: 'anonymous-id',
			$current_url: 'https://creatorhub.test/projects?token=secret#fragment',
			$referrer: 'https://creatorhub.test/account/reset-password?token=secret',
			email: 'private@example.test',
			message: 'private message',
			$set: { name: 'Private' },
			$initial_utm_campaign: 'secret',
		},
		$set: { name: 'Private' },
		$set_once: { email: 'private@example.test' },
	});
	assert.equal(event.properties.$current_url, 'https://creatorhub.test/projects');
	assert.equal(event.properties.$pathname, '/projects');
	assert.equal(event.properties.token, 'test-project-token');
	assert.equal(event.properties.$ip, null);
	assert.equal(event.properties.$process_person_profile, false);
	assert.equal(event.$set, undefined);
	assert.equal(event.$set_once, undefined);
	assert.equal(JSON.stringify(event).includes('secret'), false);
	assert.equal(JSON.stringify(event).includes('Private'), false);
	assert.equal(JSON.stringify(event).includes('private@example.test'), false);
	for (const name of ['$autocapture', '$snapshot', '$pageleave', '$identify', '$exception']) {
		assert.equal(policy.sanitizePageView({ event: name, properties: {} }), null);
	}
	assert.equal(
		policy.sanitizePageView({
			event: '$pageview',
			properties: { $current_url: 'https://creatorhub.test/inquiries/123' },
		}),
		null,
	);
});

test('captures public navigation once, skips private pages and tolerates analytics failure', async () => {
	let router = { isReady: true, pathname: '/', asPath: '/' },
		effect,
		config;
	const events = [];
	const posthog = {
		init: (_token, settings) => {
			config = settings;
		},
		capture: (name, props) => events.push({ name, props }),
	};
	const component = load(
		'libs/analytics/PostHogPageViews.tsx',
		(name) => {
			if (name === 'react')
				return {
					useEffect: (fn) => {
						effect = fn;
					},
				};
			if (name === 'next/router') return { useRouter: () => router };
			if (name === './pageViews') return policy;
			if (name === 'posthog-js') return { default: posthog };
			throw new Error(name);
		},
		{
			process: {
				env: {
					NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN: 'test-only-token',
					NEXT_PUBLIC_POSTHOG_HOST: 'https://us.i.posthog.com',
				},
			},
			window: { location: { origin: 'https://creatorhub.test' } },
		},
	);
	async function visit(pathname, asPath = pathname) {
		router = { isReady: true, pathname, asPath };
		component.default();
		effect();
		await new Promise((resolve) => setImmediate(resolve));
	}
	await visit('/');
	await visit('/');
	await visit('/projects', '/projects?search=private');
	await visit('/projects', '/projects?search=changed');
	await visit('/account/sign-in');
	await visit('/inquiries/[id]', '/inquiries/private');
	await visit('/projects');
	assert.deepEqual(
		events.map((event) => event.props.$current_url),
		['https://creatorhub.test/', 'https://creatorhub.test/projects', 'https://creatorhub.test/projects'],
	);
	for (const setting of [
		'autocapture',
		'capture_pageview',
		'capture_pageleave',
		'capture_exceptions',
		'capture_dead_clicks',
		'enable_heatmaps',
	])
		assert.equal(config[setting], false);
	for (const setting of [
		'disable_session_recording',
		'disable_surveys',
		'advanced_disable_flags',
		'disable_external_dependency_loading',
	])
		assert.equal(config[setting], true);
	assert.equal(config.person_profiles, 'never');
	assert.equal(config.persistence, 'sessionStorage');
	posthog.capture = () => {
		throw new Error('Analytics unavailable');
	};
	await visit('/about');
});
