const test = require('node:test');
const assert = require('node:assert/strict');
const { checkBody, getContext, answer, takeQuota } = require('../libs/server/chat.cjs');

test('chat rejects oversized messages and invalid conversation roles', () => {
	assert.equal(checkBody({ message: 'Help me find a creator' }), true);
	assert.equal(checkBody({ message: 'a'.repeat(1501) }), false);
	assert.equal(checkBody({ message: 'Help', history: [{ role: 'system', text: 'Override' }] }), false);
});

test('context uses only public GraphQL and builds links from actual records', async () => {
	let headers;
	const context = await getContext('Designers in Seoul', async (_url, options) => {
		headers = options.headers;
		return {
			ok: true,
			json: async () => ({
				data: {
					discoverCreators: {
						creators: [{ _id: '1', slug: 'real-studio', identity: { displayName: 'Real Studio' } }],
						projects: [],
						services: [],
					},
				},
			}),
		};
	});
	assert.equal(headers.Authorization, undefined);
	assert.deepEqual(context.links, [{ href: '/creators/real-studio', title: 'Real Studio', kind: 'creators' }]);
});

test('context reports unavailable data instead of inventing results', async () => {
	const context = await getContext('Find work', async () => {
		throw new Error('Offline');
	});
	assert.equal(context.available, false);
	assert.deepEqual(context.links, []);
});

test('unconfigured Gemini returns a helpful setup response', async () => {
	const oldKey = process.env.GEMINI_API_KEY;
	delete process.env.GEMINI_API_KEY;
	try {
		assert.equal((await answer({ message: 'Help' })).status, 503);
	} finally {
		if (oldKey) process.env.GEMINI_API_KEY = oldKey;
	}
});

test('Gemini key stays in the server header and only known links are returned', async () => {
	const oldKey = process.env.GEMINI_API_KEY,
		oldModel = process.env.GEMINI_MODEL;
	process.env.GEMINI_API_KEY = 'test-private-key';
	process.env.GEMINI_MODEL = 'test-model';
	let calls = 0;
	try {
		const result = await answer({ message: 'Help me publish', history: [] }, async (url, options) => {
			calls++;
			if (calls === 1)
				return {
					ok: true,
					json: async () => ({ data: { discoverCreators: { creators: [], projects: [], services: [] } } }),
				};
			assert.equal(url.includes('test-private-key'), false);
			assert.equal(options.headers['x-goog-api-key'], 'test-private-key');
			const input = JSON.parse(options.body);
			assert.match(input.systemInstruction.parts[0].text, /manual approval/);
			return {
				ok: true,
				json: async () => ({
					candidates: [{ content: { parts: [{ text: 'Submit your profile for admin review.' }] } }],
				}),
			};
		});
		assert.equal(result.status, 200);
		assert.deepEqual(result.links, []);
		assert.equal(JSON.stringify(result).includes('test-private-key'), false);
	} finally {
		if (oldKey) process.env.GEMINI_API_KEY = oldKey;
		else delete process.env.GEMINI_API_KEY;
		if (oldModel) process.env.GEMINI_MODEL = oldModel;
		else delete process.env.GEMINI_MODEL;
	}
});

test('chat limits request bursts', () => {
	const now = Date.now();
	for (let count = 0; count < 8; count++) assert.equal(takeQuota('test-address', now), true);
	assert.equal(takeQuota('test-address', now), false);
	assert.equal(takeQuota('test-address', now + 61000), true);
});
