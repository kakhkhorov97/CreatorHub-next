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

function configureGemini(t, fallback = 'light-model') {
	const names = ['GEMINI_API_KEY', 'GEMINI_MODEL', 'GEMINI_FALLBACK_MODEL'];
	const saved = names.map((name) => [name, process.env[name]]);
	t.after(() => {
		for (const [name, value] of saved) {
			if (value === undefined) delete process.env[name];
			else process.env[name] = value;
		}
	});
	process.env.GEMINI_API_KEY = 'test-private-key';
	process.env.GEMINI_MODEL = 'main-model';
	process.env.GEMINI_FALLBACK_MODEL = fallback;
}

function waitForAbort(signal) {
	return new Promise((_resolve, reject) => {
		if (signal.aborted) reject(signal.reason);
		else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
	});
}

function providerReply(text) {
	return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) };
}

test('a hanging primary request is aborted after ten seconds and the fallback reply succeeds', async (t) => {
	configureGemini(t);
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const attempts = [];
	const pending = answer({ message: 'How do I upload my work?' }, async (url, options) => {
		assert.ok(!url.includes('test-private-key'));
		attempts.push({ model: url.match(/models\/([^:]+)/)[1], signal: options.signal });
		if (attempts.length === 1) return waitForAbort(options.signal);
		assert.equal(attempts[0].signal.aborted, true);
		assert.equal(options.signal.aborted, false);
		return providerReply('Publish from your workspace.');
	});
	t.mock.timers.tick(9999);
	assert.equal(attempts.length, 1);
	assert.equal(attempts[0].signal.aborted, false);
	t.mock.timers.tick(1);
	const result = await pending;
	assert.equal(result.status, 200);
	assert.equal(result.reply, 'Publish from your workspace.');
	assert.deepEqual(
		attempts.map((attempt) => attempt.model),
		['main-model', 'light-model'],
	);
	assert.ok(!JSON.stringify(result).includes('test-private-key'));
	// Cleared timers cannot abort an already completed fallback later.
	t.mock.timers.tick(25000);
	assert.equal(attempts[1].signal.aborted, false);
});

test('a primary response whose body hangs also leaves time for the fallback', async (t) => {
	configureGemini(t);
	t.mock.timers.enable({ apis: ['setTimeout'] });
	let attempts = 0;
	let bodyStarted = false;
	const pending = answer({ message: 'How do I upload my work?' }, async (_url, options) => {
		attempts++;
		if (attempts === 1)
			return {
				ok: true,
				json: () => {
					bodyStarted = true;
					return waitForAbort(options.signal);
				},
			};
		return providerReply('Use the project editor.');
	});
	await new Promise(setImmediate);
	assert.equal(bodyStarted, true);
	t.mock.timers.tick(10000);
	const result = await pending;
	assert.equal(attempts, 2);
	assert.equal(result.status, 200);
	assert.equal(result.reply, 'Use the project editor.');
});

test('both hanging models share the original 25-second deadline and return the existing timeout message', async (t) => {
	configureGemini(t);
	t.mock.timers.enable({ apis: ['setTimeout'] });
	const signals = [];
	const pending = answer({ message: 'How do I upload my work?' }, async (_url, options) => {
		signals.push(options.signal);
		return waitForAbort(options.signal);
	});
	t.mock.timers.tick(10000);
	await new Promise(setImmediate);
	assert.equal(signals.length, 2);
	assert.equal(signals[1].aborted, false);
	t.mock.timers.tick(14999);
	assert.equal(signals[1].aborted, false);
	t.mock.timers.tick(1);
	const result = await pending;
	assert.equal(signals[1].aborted, true);
	assert.equal(result.status, 503);
	assert.equal(result.error, 'The reply took too long. Your message is saved in the input. Please send it again.');
});

test('after a timed-out primary, fallback errors keep their messages and never cause a third attempt', async (t) => {
	configureGemini(t);
	t.mock.timers.enable({ apis: ['setTimeout'] });
	for (const [status, error] of [
		[429, 'The assistant has reached its usage limit. Please try later.'],
		[500, 'The AI provider is busy right now. Please try again in a moment.'],
		[503, 'The AI provider is busy right now. Please try again in a moment.'],
		[401, 'The assistant needs a configuration update. Please use Help while we fix it.'],
		[403, 'The assistant needs a configuration update. Please use Help while we fix it.'],
		[400, 'The assistant model is not configured correctly. Please use Help for now.'],
		[404, 'The assistant model is not configured correctly. Please use Help for now.'],
	]) {
		let attempts = 0;
		const pending = answer({ message: 'How do I upload my work?' }, async (_url, options) => {
			attempts++;
			if (attempts === 1) return waitForAbort(options.signal);
			return { ok: false, status, headers: { get: () => '120' } };
		});
		t.mock.timers.tick(10000);
		const result = await pending;
		assert.equal(attempts, 2);
		assert.equal(result.status, status === 429 ? 429 : 503);
		assert.equal(result.error, error);
		if (status === 429) assert.equal(result.retryAfter, 120);
	}
});

test('configuration failures do not trigger a fallback, and network failures keep their existing message', async (t) => {
	configureGemini(t);
	for (const status of [400, 401, 403, 404]) {
		let attempts = 0;
		const result = await answer({ message: 'How do I upload my work?' }, async () => {
			attempts++;
			return { ok: false, status };
		});
		assert.equal(attempts, 1);
		assert.equal(result.status, 503);
		assert.match(result.error, /configur/);
	}
	let attempts = 0;
	const result = await answer({ message: 'How do I upload my work?' }, async () => {
		attempts++;
		throw new Error('Do not expose test-private-key');
	});
	assert.equal(attempts, 1);
	assert.equal(result.error, 'The assistant could not connect. Please try again in a moment.');
	assert.ok(!JSON.stringify(result).includes('test-private-key'));
});

test('without a fallback, a slow primary keeps its original deadline', async (t) => {
	configureGemini(t, '');
	t.mock.timers.enable({ apis: ['setTimeout'] });
	let signal;
	const pending = answer({ message: 'How do I upload my work?' }, async (_url, options) => {
		signal = options.signal;
		return waitForAbort(signal);
	});
	t.mock.timers.tick(10000);
	assert.equal(signal.aborted, false);
	t.mock.timers.tick(15000);
	const result = await pending;
	assert.equal(signal.aborted, true);
	assert.equal(result.status, 503);
	assert.match(result.error, /reply took too long/);
});
