const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const ts = require('typescript');
function harness() {
	const memory = new Map();
	const store = { userVar: () => {}, sessionReadyVar: () => {} };
	const ctx = {
		exports: {},
		require: () => store,
		process: { env: {} },
		Date,
		JSON,
		Promise,
		Error,
		window: {},
		sessionStorage: {
			getItem: (k) => memory.get(k) || null,
			setItem: (k, v) => memory.set(k, v),
			removeItem: (k) => memory.delete(k),
		},
		fetch: async () => {
			throw Error('Unexpected request');
		},
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('libs/auth/index.ts', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
		}).outputText,
		ctx,
	);
	return { api: ctx.exports, ctx, memory };
}
const payload = {
	accessToken: 'test-access',
	refreshToken: 'test-refresh',
	expiresIn: 900,
	user: { _id: 'test-user' },
};
test('return path prevents external and protocol-relative redirects', () => {
	const { api } = harness();
	for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', null])
		assert.equal(api.safeReturnTo(path), '/workspace');
	assert.equal(api.safeReturnTo('/projects/123?tab=work'), '/projects/123?tab=work');
});
test('valid access token is reused without refresh', async () => {
	const { api } = harness();
	api.saveSession(payload);
	assert.equal(await api.accessToken(), 'test-access');
	api.clearSession();
	assert.equal(await api.accessToken(), null);
});
test('parallel expired requests rotate the refresh token once', async () => {
	const { api, ctx } = harness();
	let calls = 0;
	ctx.fetch = async () => {
		calls++;
		await new Promise((r) => setTimeout(r, 5));
		return {
			ok: true,
			json: async () => ({
				data: { refreshSession: { ...payload, accessToken: 'rotated', refreshToken: 'rotated-refresh' } },
			}),
		};
	};
	api.saveSession({ ...payload, expiresIn: 0 });
	const results = await Promise.all([api.accessToken(), api.accessToken(), api.accessToken()]);
	assert.equal(calls, 1);
	assert.deepEqual(results, ['rotated', 'rotated', 'rotated']);
});
test('logout during a refresh cannot restore authentication', async () => {
	const { api, ctx } = harness();
	let resolve;
	ctx.fetch = () => new Promise((r) => (resolve = r));
	api.saveSession({ ...payload, expiresIn: 0 });
	const pending = api.accessToken();
	api.clearSession();
	resolve({ ok: true, json: async () => ({ data: { refreshSession: payload } }) });
	assert.equal(await pending, null);
	assert.equal(api.readSession(), null);
});
test('invalid refresh clears the session', async () => {
	const { api, ctx } = harness();
	ctx.fetch = async () => ({ ok: true, json: async () => ({ errors: [{ message: 'Invalid session' }] }) });
	api.saveSession({ ...payload, expiresIn: 0 });
	await assert.rejects(api.accessToken(), /session expired/);
	assert.equal(api.readSession(), null);
});
