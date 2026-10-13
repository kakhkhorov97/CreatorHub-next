const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function harness(upstream = { ok: true, status: 202, headers: new Headers() }) {
	const calls = [];
	const context = {
		exports: {},
		URL,
		AbortSignal,
		process: { env: { API_GRAPHQL_URL: 'https://api.example.com/graphql' } },
		fetch: async (...args) => {
			calls.push(args);
			return upstream;
		},
		require: (name) => {
			if (name.includes('client-ip')) return { clientIp: () => '192.0.2.5' };
			throw Error(name);
		},
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('pages/api/contact.ts', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS },
		}).outputText,
		context,
	);
	const response = {
		headers: {},
		setHeader(k, v) {
			this.headers[k] = v;
		},
		status(s) {
			this.code = s;
			return this;
		},
		json(b) {
			this.body = b;
			return this;
		},
	};
	const request = {
		method: 'POST',
		headers: { host: 'creatorhub.example', origin: 'https://creatorhub.example' },
		body: { name: 'Sean', email: 'reader@example.com', message: 'A question about my account.', website: '' },
	};
	return { run: () => context.exports.default(request, response), request, response, calls };
}
test('contact form uses backend delivery without browser secrets or arbitrary recipient', async () => {
	const h = harness();
	await h.run();
	assert.equal(h.response.code, 202);
	assert.equal(String(h.calls[0][0]), 'https://api.example.com/contact');
	assert.equal(h.calls[0][1].headers['X-Forwarded-For'], '192.0.2.5');
	assert.equal(JSON.parse(h.calls[0][1].body).email, 'reader@example.com');
	assert.equal(h.calls[0][1].headers.Authorization, undefined);
});
test('contact rejects cross-origin requests and malformed fields before delivery', async () => {
	for (const change of [
		(h) => (h.request.headers.origin = 'https://evil.example'),
		(h) => (h.request.body.email = 'invalid'),
		(h) => (h.request.body.website = 'bot'),
		(h) => (h.request.body.name = 'Name\r\nInjected'),
	]) {
		const h = harness();
		change(h);
		await h.run();
		assert.ok([400, 403].includes(h.response.code));
		assert.equal(h.calls.length, 0);
	}
});
test('contact does not report success on provider failure and preserves retry delay', async () => {
	const h = harness({ ok: false, status: 503, headers: new Headers() });
	await h.run();
	assert.equal(h.response.code, 503);
	assert.equal(h.response.body.accepted, undefined);
	const limited = harness({ ok: false, status: 429, headers: new Headers({ 'Retry-After': '321' }) });
	await limited.run();
	assert.equal(limited.response.code, 429);
	assert.equal(limited.response.headers['Retry-After'], '321');
});
