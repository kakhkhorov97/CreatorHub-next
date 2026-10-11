const fs = require('node:fs');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('./backend-path.cjs').backendRequire('mongodb');
const docs = JSON.parse(fs.readFileSync('docs/operations.json'));
const uri = JSON.parse(fs.readFileSync('.preview-db.json')).uri;
const addr = new URL(uri);
if (addr.hostname !== '127.0.0.1' || addr.pathname !== '/creatorhub_frontend_test')
	throw Error('Only the disposable preview database is permitted');
const checks = [];
async function op(name, variables = {}, token, rejected = false) {
	const r = await fetch('http://127.0.0.1:7001/graphql', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: JSON.stringify({ query: docs.find((x) => x.name === name).document, variables }),
	});
	const b = await r.json();
	if (rejected) {
		assert.ok(b.errors, name + ' must reject');
		return;
	}
	assert.ok(!b.errors, JSON.stringify(b.errors));
	return b.data[name];
}
(async () => {
	const client = await MongoClient.connect(uri);
	const db = client.db();
	let created;
	const admin = await op('login', { input: { email: 'admin@frontend.test', password: 'Frontend-test-password-123' } });
	try {
		const viewer = await op('login', {
			input: { email: 'client-1@creatorhub.example', password: 'CreatorHub-demo-2026!' },
		});
		const input = {
			title: 'Community validation fixture',
			description: 'Disposable test listing, archived after validation.',
			startsAt: '2030-02-10T10:00:00Z',
			endsAt: '2030-02-10T11:00:00Z',
			location: 'Online',
			status: 'DRAFT',
			isDemo: true,
		};
		await op('createEvent', { input }, undefined, true);
		await op('createEvent', { input }, viewer.accessToken, true);
		await op('adminEvents', {}, viewer.accessToken, true);
		checks.push('Anonymous and client event administration rejected');
		await op('createEvent', { input: { ...input, endsAt: '2029-01-01T00:00:00Z' } }, admin.accessToken, true);
		await op('createEvent', { input: { ...input, eventUrl: 'javascript:alert(1)' } }, admin.accessToken, true);
		await op('createEvent', { input: { ...input, eventUrl: 'http://example.com' } }, admin.accessToken, true);
		await op('createEvent', { input: { ...input, title: null } }, admin.accessToken, true);
		checks.push('Reversed dates, unsafe links, and null required fields rejected');
		created = await op('createEvent', { input }, admin.accessToken);
		await op('getEvent', { id: created._id }, undefined, true);
		assert.ok(!(await op('getEvents', { input: { upcoming: false, limit: 50 } })).some((x) => x._id === created._id));
		assert.ok(
			(await op('adminEvents', { input: { upcoming: false, limit: 50 } }, admin.accessToken)).some(
				(x) => x._id === created._id,
			),
		);
		checks.push('Draft hidden publicly and visible to administrator');
		await op(
			'updateEvent',
			{ id: created._id, input: { ...input, status: 'PUBLISHED', eventUrl: 'https://example.com/event' } },
			admin.accessToken,
		);
		assert.equal((await op('getEvent', { id: created._id })).eventUrl, 'https://example.com/event');
		assert.ok((await op('getEvents', { input: { limit: 50 } })).some((x) => x._id === created._id));
		await op(
			'updateEvent',
			{
				id: created._id,
				input: {
					...input,
					status: 'PUBLISHED',
					startsAt: '2020-01-01T10:00:00Z',
					endsAt: '2020-01-01T11:00:00Z',
					eventUrl: '',
				},
			},
			admin.accessToken,
		);
		assert.ok(!(await op('getEvents', { input: { limit: 50 } })).some((x) => x._id === created._id));
		assert.equal((await op('getEvent', { id: created._id })).eventUrl, '');
		checks.push('Published event visible, past event excluded from upcoming, event link clearable');
		await op('updateEvent', { id: created._id, input: { ...input, status: 'ARCHIVED' } }, admin.accessToken);
		await op('getEvent', { id: created._id }, undefined, true);
		checks.push('Archived event hidden publicly');
		const recent = await op('getProjects', { input: { sort: 'RECENT', limit: 50 } });
		const ranked = await op('getProjects', { input: { sort: 'POPULAR', limit: 50 } });
		const counts = await db
			.collection('projectLikes')
			.aggregate([{ $group: { _id: '$projectId', total: { $sum: 1 } } }])
			.toArray();
		const likes = new Map(counts.map((x) => [String(x._id), x.total]));
		const expected = [...recent.list].sort(
			(a, b) =>
				(likes.get(b._id) || 0) - (likes.get(a._id) || 0) ||
				new Date(b.publishedAt) - new Date(a.publishedAt) ||
				b._id.localeCompare(a._id),
		);
		assert.deepEqual(
			ranked.list.map((x) => x._id),
			expected.map((x) => x._id),
		);
		const popular = ranked.list.slice(0, 6);
		const fresh = await op('getProjects', {
			input: { sort: 'RECENT', limit: 6, excludeProjectIds: popular.map((x) => x._id) },
		});
		assert.equal(popular.length, 6);
		assert.equal(fresh.list.length, 6);
		assert.ok(fresh.list.every((x) => !popular.some((p) => p._id === x._id)));
		assert.equal(fresh.metaCounter[0].total, recent.list.length - 6);
		await op('getProjects', { input: { excludeProjectIds: ['bad-id'] } }, undefined, true);
		await op('getProjects', { input: { excludeProjectIds: Array(51).fill(popular[0]._id) } }, undefined, true);
		checks.push(
			'Popular order matches actual likes and newest tie-break; six recent projects exclude six popular; exclusions validated',
		);
		const cities = await op('getCities');
		assert.ok(cities.some((c) => c.key === 'gwangju'));
		assert.ok(!cities.some((c) => c.key === 'london'));
		await op('getCreators', { input: { city: 'gwangju' } });
		for (const title of ['Lume, Lisbon', 'Copenhagen', 'FRAME, Tokyo'])
			assert.ok(recent.list.some((p) => p.title.includes(title)));
		assert.equal((await op('getEvents', { input: { limit: 50 } })).filter((x) => x.isDemo).length, 3);
		checks.push('Korean cities only, three portfolio studies and three Korean or online demo events present');
		fs.writeFileSync(
			'docs/verification/community.json',
			JSON.stringify(
				{
					passed: true,
					checks,
					operations: ['getEvents', 'getEvent', 'adminEvents', 'createEvent', 'updateEvent', 'getProjects'],
					environment: 'Local disposable replica set and real resolvers',
				},
				null,
				2,
			) + '\n',
		);
		console.log('PASS: ' + checks.length + ' community checks.');
	} finally {
		if (created) await db.collection('creativeEvents').deleteOne({ _id: new ObjectId(created._id) });
		await client.close();
	}
})().catch((e) => {
	console.error(e.message);
	process.exitCode = 1;
});
