const { approveDemoSubmission } = require('./approve-demo.cjs');
// Fictional fixtures only. Never writes to a production database.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId, BSON } = require('./backend-path.cjs').backendRequire('mongodb');
const root = path.resolve(__dirname, '..');
const uri = JSON.parse(fs.readFileSync(path.join(root, '.preview-db.json'))).uri;
const address = new URL(uri);
if (address.hostname !== '127.0.0.1' || address.pathname !== '/creatorhub_frontend_test')
	throw Error('Only the local disposable preview database is permitted');
const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs/operations.json')));
async function op(name, variables = {}, token, fail = false) {
	const r = await fetch('http://127.0.0.1:7001/graphql', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: JSON.stringify({ query: docs.find((d) => d.name === name).document, variables }),
	});
	const b = await r.json();
	if (fail) {
		assert.ok(b.errors, name + ' must be rejected');
		return;
	}
	assert.ok(!b.errors, name + ': ' + JSON.stringify(b.errors));
	return b.data[name];
}
const password = 'CreatorHub-demo-2026!';
const projects = [
	{
		owner: 'mina-park',
		slug: 'lume-lisbon-concept',
		file: 'lume-lisbon',
		title: 'Lume, Lisbon • Olive oil identity',
		category: 'Branding',
		tags: ['brand identity', 'packaging', 'lisbon'],
		description:
			'A fictional artisan olive oil brand in Lisbon, Portugal. This concept explores cream paper, botanical details, and a quiet identity system. The artwork was generated with AI for this demo; no real client or commission is implied.',
	},
	{
		owner: 'seo-jun-kang',
		slug: 'copenhagen-reading-room-concept',
		file: 'copenhagen-reading-room',
		title: 'Copenhagen • A room for reading',
		category: 'Photography',
		tags: ['architecture', 'photography', 'copenhagen'],
		description:
			'An architectural photography concept for a fictional reading room in Copenhagen, Denmark. Pale oak, soft daylight, and tactile materials define the brief. The artwork was generated with AI for this demo; this is not a photograph of a real building.',
	},
	{
		owner: 'eun-lim',
		slug: 'frame-tokyo-concept',
		file: 'frame-tokyo',
		title: 'FRAME, Tokyo • Independent journal',
		category: 'Editorial design',
		tags: ['editorial design', 'typography', 'tokyo'],
		description:
			'A fictional independent design journal in Tokyo, Japan. The concept pairs a restrained navy cover with architectural imagery and editorial typography. The artwork was generated with AI for this demo; no real publication or client is implied.',
	},
];
const eventInputs = [
	{
		title: 'Independent design conversations',
		description:
			'Fictional demo event. A sample online conversation about independent practice, sharing work, and collaborating across Korea. This is not a real scheduled event and registration is unavailable.',
		location: 'Online • Korea',
		startsAt: '2026-11-07T14:00:00Z',
		endsAt: '2026-11-07T15:30:00Z',
	},
	{
		title: 'Portfolio exchange in Seoul',
		description:
			'Fictional demo event. A sample peer session for discussing portfolios and creative briefs in Seoul. No actual venue or organizer is associated with this listing.',
		location: 'Seoul, Korea • demo venue',
		startsAt: '2026-11-14T10:00:00Z',
		endsAt: '2026-11-14T12:00:00Z',
	},
	{
		title: 'Editorial workshop in Gwangju',
		description:
			'Fictional demo event. A sample workshop about typography, print, and editorial layouts in Gwangju. This listing demonstrates the event page and is not open for registration.',
		location: 'Gwangju, Korea • demo venue',
		startsAt: '2026-11-21T04:00:00Z',
		endsAt: '2026-11-21T06:00:00Z',
	},
];
(async () => {
	const client = await MongoClient.connect(uri);
	const db = client.db();
	try {
		if (process.env.RESTORE_PREVIEW_BACKUP === '1') {
			const data = BSON.EJSON.parse(
				fs.readFileSync(process.env.PREVIEW_BACKUP_PATH || path.join(root, '.local/preview-backup.ejson'), 'utf8'),
			);
			for (const [name, rows] of Object.entries(data)) {
				await db.collection(name).deleteMany({});
				if (rows.length) await db.collection(name).insertMany(rows);
			}
			console.log('Restored existing preview accounts and content.');
		}
		const admin = await op('login', {
			input: { email: 'admin@frontend.test', password: 'Frontend-test-password-123' },
		});
		const categories = await op('categories');
		const made = [];
		for (const p of projects) {
			const session = await op('login', { input: { email: p.owner + '@creatorhub.example', password } });
			const existing = await op('getMyProjects', { input: { limit: 50 } }, session.accessToken);
			let record = existing.list.find((x) => x.slug === p.slug);
			if (!record) {
				const url = `https://media.example.com/creatorhub/${session.user._id}/${p.file}.png`;
				record = await op(
					'createProject',
					{
						input: {
							title: p.title,
							slug: p.slug,
							categoryId: categories.find((c) => c.name === p.category)._id,
							summary: 'Fictional international portfolio study with AI-generated artwork.',
							description: p.description,
							tags: p.tags,
							coverImageUrl: url,
							media: [{ type: 'IMAGE', url, altText: p.title + ' (AI-generated concept)', sortOrder: 0 }],
						},
					},
					session.accessToken,
				);
				await op('setProjectStatus', { projectId: record._id, status: 'PUBLISHED' }, session.accessToken);
				await approveDemoSubmission(op, session.accessToken, admin.accessToken);
			}
			const local = '/demo-media/' + p.file + '.png';
			await db
				.collection('portfolioProjects')
				.updateOne({ _id: new ObjectId(record._id) }, { $set: { coverImageUrl: local, 'media.0.url': local } });
			made.push(record);
		}
		// Demo likes use the real authenticated mutation and existing fictional client accounts.
		for (let i = 1; i <= 3; i++) {
			const session = await op('login', { input: { email: `client-${i}@creatorhub.example`, password } });
			for (const p of made) await op('setProjectLike', { projectId: p._id, liked: true }, session.accessToken);
		}
		const existing = await op('adminEvents', { input: { upcoming: false, limit: 50 } }, admin.accessToken);
		for (const input of eventInputs)
			if (!existing.some((e) => e.title === input.title))
				await op('createEvent', { input: { ...input, isDemo: true, status: 'PUBLISHED' } }, admin.accessToken);
		console.log('Added 3 international portfolio studies and 3 clearly labeled fictional events.');
	} finally {
		await client.close();
	}
})().catch((e) => {
	console.error(e.message);
	process.exitCode = 1;
});
