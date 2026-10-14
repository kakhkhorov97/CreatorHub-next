const test = require('node:test');
const assert = require('node:assert/strict');
const { checkBody, getContext, retrieveKnowledge, answer, takeQuota } = require('../libs/server/chat.cjs');

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

test('retrieval selects relevant website facts for account help', () => {
	const sources = retrieveKnowledge('How do I reset my password?');
	assert.equal(sources[0].id, 'accounts');
	assert.ok(sources.every((source) => source.path.startsWith('/')));
	assert.ok(sources.length <= 4);
});

test('live contact and events come only from public GraphQL fields', async () => {
	let query;
	const context = await getContext('How can I contact the team about events?', async (_url, options) => {
		query = JSON.parse(options.body).query;
		assert.equal(options.headers.Authorization, undefined);
		return {
			ok: true,
			json: async () => ({
				data: {
					discoverCreators: { creators: [], projects: [], services: [] },
					getSiteContent: { aboutText: 'About', contactText: 'Write to us.', contactEmail: 'hello@example.test' },
					getEvents: [
						{
							_id: 'event1',
							title: 'Design meetup',
							description: 'A public event',
							startsAt: '2026-10-12',
							endsAt: '2026-10-12',
							location: 'Seoul',
							isDemo: true,
						},
					],
					categories: [],
				},
			}),
		};
	});
	assert.match(query, /getSiteContent/);
	assert.match(query, /getEvents/);
	assert.doesNotMatch(query, /getInquiries|getMyAuthIdentities|adminDirectory/);
	assert.ok(
		context.sources.some((source) => source.id === 'live-contact' && source.text.includes('hello@example.test')),
	);
	assert.ok(
		context.sources.some((source) => source.id === 'event-event1' && source.text.includes('fictional concept: yes')),
	);
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
			if (url.includes('/graphql'))
				return {
					ok: true,
					json: async () => ({ data: { discoverCreators: { creators: [], projects: [], services: [] } } }),
				};
			assert.equal(url.includes('test-private-key'), false);
			assert.equal(options.headers['x-goog-api-key'], 'test-private-key');
			const input = JSON.parse(options.body);
			assert.match(input.systemInstruction.parts[0].text, /administrator review/);
			return {
				ok: true,
				json: async () => ({
					candidates: [{ content: { parts: [{ text: 'Submit your profile for admin review.' }] } }],
				}),
			};
		});
		assert.equal(result.status, 200);
		assert.ok(result.links.some((link) => link.href === '/faq'));
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
// Appended regression cases for provider failure classification.
test('workflow help skips database retrieval and overload retries only once', async () => {
	const oldKey = process.env.GEMINI_API_KEY,
		oldModel = process.env.GEMINI_MODEL,
		oldFallback = process.env.GEMINI_FALLBACK_MODEL;
	process.env.GEMINI_API_KEY = 'test-key';
	process.env.GEMINI_MODEL = 'test-model';
	process.env.GEMINI_FALLBACK_MODEL = '';
	try {
		let calls = 0;
		const result = await answer({ message: 'How do I upload my work?' }, async (url) => {
			assert.match(url, /generativelanguage/);
			calls++;
			return calls === 1
				? { ok: false, status: 503 }
				: {
						ok: true,
						json: async () => ({ candidates: [{ content: { parts: [{ text: 'Use the project editor.' }] } }] }),
				  };
		});
		assert.equal(result.status, 200);
		assert.equal(calls, 2);
		for (const status of [403, 404, 429]) {
			let attempts = 0;
			const failed = await answer({ message: 'How do I upload my work?' }, async () => {
				attempts++;
				return { ok: false, status };
			});
			assert.equal(attempts, 1);
			assert.equal(failed.status, status === 429 ? 429 : 503);
			assert.doesNotMatch(failed.error, /unavailable/);
		}
	} finally {
		if (oldKey) process.env.GEMINI_API_KEY = oldKey;
		else delete process.env.GEMINI_API_KEY;
		if (oldModel) process.env.GEMINI_MODEL = oldModel;
		else delete process.env.GEMINI_MODEL;
		if (oldFallback === undefined) delete process.env.GEMINI_FALLBACK_MODEL;
		else process.env.GEMINI_FALLBACK_MODEL = oldFallback;
	}
});

test('a busy or rate-limited model falls back once to the lighter model, and real errors do not', async () => {
	const saved = ['GEMINI_API_KEY', 'GEMINI_MODEL', 'GEMINI_FALLBACK_MODEL'].map((name) => [name, process.env[name]]);
	process.env.GEMINI_API_KEY = 'test-key';
	process.env.GEMINI_MODEL = 'main-model';
	process.env.GEMINI_FALLBACK_MODEL = 'light-model';
	try {
		for (const status of [429, 500, 503]) {
			const urls = [];
			const result = await answer({ message: 'How do I upload my work?' }, async (url) => {
				urls.push(url);
				return urls.length === 1
					? { ok: false, status, headers: { get: () => null } }
					: { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: 'Use the editor.' }] } }] }) };
			});
			assert.equal(result.status, 200);
			assert.equal(result.reply, 'Use the editor.');
			assert.deepEqual(
				urls.map((url) => url.match(/models\/([^:]+)/)[1]),
				['main-model', 'light-model'],
			);
		}
		let attempts = 0;
		const config = await answer({ message: 'How do I upload my work?' }, async () => {
			attempts++;
			return { ok: false, status: 404 };
		});
		assert.equal(attempts, 1);
		assert.match(config.error, /not configured correctly/);
	} finally {
		for (const [name, value] of saved) {
			if (value === undefined) delete process.env[name];
			else process.env[name] = value;
		}
	}
});

test('chat burst limits isolate visitors and return the remaining delay', () => {
	const { quotaStatus } = require('../libs/server/chat.cjs');
	const now = Date.parse('2099-01-01T12:00:00Z');
	for (let i = 0; i < 8; i++) assert.equal(quotaStatus('visitor-one', now).allowed, true);
	assert.equal(quotaStatus('visitor-one', now + 15000).retryAfter, 45);
	assert.equal(quotaStatus('visitor-two', now + 15000).allowed, true);
	assert.equal(quotaStatus('visitor-one', now + 61000).allowed, true);
});
test('daily chat limit reports the actual reset rather than a one-minute retry', () => {
	const { quotaStatus } = require('../libs/server/chat.cjs');
	const old = process.env.CHAT_DAILY_LIMIT;
	process.env.CHAT_DAILY_LIMIT = '1';
	try {
		const now = Date.parse('2099-01-03T23:50:00Z');
		assert.equal(quotaStatus('daily-a', now).allowed, true);
		const blocked = quotaStatus('daily-b', now);
		assert.equal(blocked.allowed, false);
		assert.equal(blocked.retryAfter, 600);
		assert.match(blocked.error, /daily/);
		assert.equal(quotaStatus('daily-b', now + 601000).allowed, true);
	} finally {
		if (old === undefined) delete process.env.CHAT_DAILY_LIMIT;
		else process.env.CHAT_DAILY_LIMIT = old;
	}
});
