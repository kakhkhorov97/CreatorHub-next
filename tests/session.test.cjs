const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const ts = require('typescript');
function harness(memory = new Map(), requestLock) {
	const store = { userVar: () => {}, sessionReadyVar: () => {} };
	const ctx = {
		exports: {},
		require: () => store,
		process: { env: {} },
		AbortSignal,
		Date,
		JSON,
		Promise,
		Error,
		window: {
			addEventListener: (name, handler) => {
				ctx.listener = handler;
			},
			removeEventListener: () => {},
			location: {
				reload: () => {
					ctx.reloaded = true;
				},
			},
		},
		crypto: require('node:crypto'),
		navigator: { locks: { request: requestLock || ((_name, callback) => callback()) } },
		localStorage: {
			getItem: (k) => memory.get(k) || null,
			setItem: (k, v) => memory.set(k, v),
			removeItem: (k) => memory.delete(k),
		},
		sessionStorage: { removeItem: () => {} },
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
	for (const path of ['https://evil.test', '//evil.test', '/\\evil.test', '/\n/evil.test', '/\t/evil.test', null])
		assert.equal(api.safeReturnTo(path), '/');
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
	ctx.fetch = async () => ({
		ok: true,
		json: async () => ({ errors: [{ message: 'Invalid session', extensions: { code: 'UNAUTHENTICATED' } }] }),
	});
	api.saveSession({ ...payload, expiresIn: 0 });
	await assert.rejects(api.accessToken(), /session expired/);
	assert.equal(api.readSession(), null);
});

test('registration defaults home and authentication resumes the requested activity', () => {
	const { api } = harness();
	assert.equal(api.authenticationDestination(undefined, '/workspace', 'USER', true), '/');
	assert.equal(
		api.authenticationDestination('/inquiries/new?creatorId=123', undefined, 'USER', true),
		'/inquiries/new?creatorId=123',
	);
	assert.equal(
		api.authenticationDestination(undefined, '/inquiries/new?creatorId=123', 'USER'),
		'/inquiries/new?creatorId=123',
	);
	assert.equal(api.authenticationDestination(undefined, undefined, 'USER'), '/');
	assert.equal(api.authenticationDestination(undefined, undefined, 'ADMIN'), '/_admin');
	assert.equal(api.authenticationDestination('//evil.test', undefined, 'USER'), '/');
});

for (const status of [429, 500, 502, 503, 504]) {
	test(`HTTP ${status} preserves the saved session and allows a later refresh`, async () => {
		const { api, ctx, memory } = harness();
		api.saveSession({ ...payload, expiresIn: 0 });
		const original = memory.get('creatorhub.session');
		ctx.fetch = async () => ({
			ok: false,
			status,
			json: async () => {
				throw new Error('HTML error page');
			},
		});
		await assert.rejects(api.accessToken(), /try again/);
		assert.equal(memory.get('creatorhub.session'), original);
		ctx.fetch = async () => ({ ok: true, status: 200, json: async () => ({ data: { refreshSession: payload } }) });
		assert.equal(await api.accessToken(), payload.accessToken);
	});
}

for (const failure of ['offline', 'invalid-json', 'graphql-server-error', 'missing-payload', 'null-response']) {
	test(`${failure} does not clear the session`, async () => {
		const { api, ctx, memory } = harness();
		api.saveSession({ ...payload, expiresIn: 0 });
		const original = memory.get('creatorhub.session');
		ctx.fetch = async () => {
			if (failure === 'offline') throw new Error('Network unavailable');
			return {
				ok: true,
				status: 200,
				json: async () => {
					if (failure === 'invalid-json') throw new SyntaxError('Bad JSON');
					if (failure === 'null-response') return null;
					if (failure === 'graphql-server-error')
						return { errors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] };
					return { data: { refreshSession: null } };
				},
			};
		};
		await assert.rejects(api.accessToken(), /Unable to refresh/);
		assert.equal(memory.get('creatorhub.session'), original);
	});
}

for (const status of [401, 403]) {
	test(`HTTP ${status} clears an invalid session even when the response is not JSON`, async () => {
		const { api, ctx, memory } = harness();
		api.saveSession({ ...payload, expiresIn: 0 });
		ctx.fetch = async () => ({ ok: false, status });
		await assert.rejects(api.accessToken(), /session expired/);
		assert.equal(api.readSession(), null);
		assert.equal(memory.has('creatorhub.session'), false);
	});
}

test('an old failed refresh cannot clear a newly signed-in account', async () => {
	const { api, ctx } = harness();
	let resolve;
	ctx.fetch = () =>
		new Promise((done) => {
			resolve = done;
		});
	api.saveSession({ ...payload, expiresIn: 0 });
	const pending = api.accessToken();
	api.saveSession({ ...payload, refreshToken: 'different-account-refresh' });
	resolve({ ok: false, status: 401 });
	await assert.rejects(pending, /session expired/);
	assert.equal(api.readSession().refreshToken, 'different-account-refresh');
});

test('Nest authentication errors are distinguished from transient GraphQL errors', () => {
	const { api } = harness();
	assert.equal(
		api.isAuthenticationError({ graphQLErrors: [{ extensions: { originalError: { statusCode: 401 } } }] }),
		true,
	);
	assert.equal(api.isAuthenticationError({ graphQLErrors: [{ extensions: { code: 'FORBIDDEN' } }] }), true);
	assert.equal(
		api.isAuthenticationError({ graphQLErrors: [{ extensions: { originalError: { statusCode: 429 } } }] }),
		false,
	);
});

test('new tabs share one account and observe logout immediately', () => {
	const shared = new Map();
	const first = harness(shared);
	const second = harness(shared);
	first.api.saveSession(payload);
	assert.equal(second.api.readSession().refreshToken, payload.refreshToken);
	second.api.clearSession();
	assert.equal(first.api.readSession(), null);
});

test('two tabs refresh once under a shared browser lock', async () => {
	const shared = new Map();
	let tail = Promise.resolve();
	const lock = (_name, callback) => {
		const next = tail.then(callback);
		tail = next.catch(() => {});
		return next;
	};
	const first = harness(shared, lock);
	const second = harness(shared, lock);
	let calls = 0;
	const fetch = async () => {
		calls++;
		await new Promise((resolve) => setTimeout(resolve, 5));
		return {
			ok: true,
			json: async () => ({
				data: { refreshSession: { ...payload, accessToken: 'rotated', refreshToken: 'new-refresh' } },
			}),
		};
	};
	first.ctx.fetch = fetch;
	second.ctx.fetch = fetch;
	first.api.saveSession({ ...payload, expiresIn: 0 });
	const identity = first.api.readSession().sessionId;
	assert.deepEqual(await Promise.all([first.api.accessToken(), second.api.accessToken()]), ['rotated', 'rotated']);
	assert.equal(calls, 1);
	assert.equal(second.api.readSession().sessionId, identity);
});

test('cross-tab account changes reload private state, refresh rotations do not', () => {
	const shared = new Map();
	const first = harness(shared);
	const second = harness(shared);
	first.api.saveSession(payload);
	const previous = shared.get('creatorhub.session');
	second.api.watchSharedSession();
	const rotated = JSON.parse(previous);
	rotated.refreshToken = 'rotated';
	shared.set('creatorhub.session', JSON.stringify(rotated));
	second.ctx.listener({ key: 'creatorhub.session', storageArea: second.ctx.localStorage, oldValue: previous });
	assert.equal(second.ctx.reloaded, undefined);
	first.api.saveSession({ ...payload, refreshToken: 'another-account' });
	second.ctx.listener({ key: 'creatorhub.session', storageArea: second.ctx.localStorage, oldValue: previous });
	assert.equal(second.ctx.reloaded, true);
});

test('a delayed response cannot clear a newer shared login', () => {
	const { api } = harness();
	api.saveSession(payload);
	const old = api.readSession().sessionId;
	api.saveSession({ ...payload, refreshToken: 'another-account' });
	api.clearSession(old);
	assert.equal(api.readSession().refreshToken, 'another-account');
});

test('logout in another tab prevents an in-flight refresh from restoring it', async () => {
	const shared = new Map();
	const first = harness(shared);
	const second = harness(shared);
	let respond;
	first.ctx.fetch = () =>
		new Promise((resolve) => {
			respond = resolve;
		});
	first.api.saveSession({ ...payload, expiresIn: 0 });
	const pending = first.api.accessToken();
	second.api.clearSession();
	respond({ ok: true, json: async () => ({ data: { refreshSession: payload } }) });
	assert.equal(await pending, null);
	assert.equal(first.api.readSession(), null);
});

test('missing browser locks cannot send an unsafe refresh request', async () => {
	const { api, ctx } = harness();
	api.saveSession({ ...payload, expiresIn: 0 });
	ctx.navigator = {};
	await assert.rejects(api.accessToken(), /Secure session refresh is unavailable/);
	assert.equal(api.readSession().refreshToken, payload.refreshToken);
});
