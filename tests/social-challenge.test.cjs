const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function setup() {
	const storage = new Map();
	let now = 1000000;
	const api = {};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('libs/auth/socialChallenge.ts', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS },
		}).outputText,
		{
			exports: api,
			Date: { now: () => now },
			sessionStorage: {
				getItem: (k) => storage.get(k) || null,
				setItem: (k, v) => storage.set(k, v),
				removeItem: (k) => storage.delete(k),
			},
		},
	);
	return { api, storage, advance: (ms) => (now += ms) };
}
test('repeated auth page mounts share one unconsumed challenge, with providers isolated', async () => {
	const { api } = setup();
	let calls = 0;
	const load = async () => {
		calls++;
		return 'a'.repeat(64);
	};
	const [one, two] = await Promise.all([
		api.getSocialChallenge('GOOGLE', load),
		api.getSocialChallenge('GOOGLE', load),
	]);
	assert.equal(one, two);
	assert.equal(calls, 1);
	await api.getSocialChallenge('GOOGLE', load);
	assert.equal(calls, 1);
	await api.getSocialChallenge('TELEGRAM', load);
	assert.equal(calls, 2);
	api.discardSocialChallenge('GOOGLE');
	await api.getSocialChallenge('GOOGLE', load);
	assert.equal(calls, 3);
});
test('expired challenges and failed preparation fetch a new challenge', async () => {
	const { api, advance } = setup();
	let calls = 0;
	const load = async () => {
		calls++;
		return 'b'.repeat(64);
	};
	await api.getSocialChallenge('GOOGLE', load);
	advance(8 * 60000);
	await api.getSocialChallenge('GOOGLE', load);
	assert.equal(calls, 2);
	await assert.rejects(
		api.getSocialChallenge('TELEGRAM', async () => {
			throw new Error('Offline');
		}),
	);
	await api.getSocialChallenge('TELEGRAM', load);
	assert.equal(calls, 3);
});
test('rate-limit feedback uses the API retry time and bounds malformed values', () => {
	const { api } = setup();
	assert.equal(api.retrySeconds({ graphQLErrors: [{ extensions: { originalError: { retryAfterSeconds: 23 } } }] }), 23);
	assert.equal(api.retrySeconds({ networkError: { statusCode: 429 } }), 60);
	assert.equal(api.retrySeconds({ message: 'Too many requests. Try again shortly.' }), 60);
	assert.equal(
		api.retrySeconds({ graphQLErrors: [{ extensions: { originalError: { retryAfterSeconds: 999 } } }] }),
		60,
	);
	assert.equal(api.retrySeconds(new Error('Incorrect password')), 0);
});
