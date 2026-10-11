const fs = require('node:fs');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { MongoClient, ObjectId } = require('./backend-path.cjs').backendRequire('mongodb');
const uri = JSON.parse(fs.readFileSync('.preview-db.json')).uri;
const address = new URL(uri);
if (address.hostname !== '127.0.0.1' || address.pathname !== '/creatorhub_frontend_test')
	throw Error('Only the disposable preview database is permitted');
const docs = JSON.parse(fs.readFileSync('docs/operations.json'));
const checks = [],
	seen = new Set();
async function op(name, variables = {}, token, rejected = false) {
	const response = await fetch('http://127.0.0.1:7001/graphql', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: JSON.stringify({ query: docs.find((d) => d.name === name).document, variables }),
	});
	const body = await response.json();
	if (rejected) {
		assert.ok(body.errors, `${name} should reject`);
		return;
	}
	assert.ok(!body.errors, `${name}: ${JSON.stringify(body.errors)}`);
	seen.add(name);
	return body.data[name];
}
(async () => {
	const dbClient = await MongoClient.connect(uri),
		db = dbClient.db();
	const admin = await op('login', { input: { email: 'admin@frontend.test', password: 'Frontend-test-password-123' } });
	const viewer = await op('login', {
		input: { email: 'client-1@creatorhub.example', password: 'CreatorHub-demo-2026!' },
	});
	const at = admin.accessToken,
		vt = viewer.accessToken;
	const originalUser =
		(await db.collection('users').findOne({ displayName: 'Alex Morgan' })) ||
		(await db.collection('users').findOne({
			role: 'USER',
			_id: { $nin: [new ObjectId(admin.user._id), new ObjectId(viewer.user._id)] },
			status: 'ACTIVE',
		}));
	const creator = await db.collection('creatorProfiles').findOne({ slug: 'mina-park' });
	const project = await db
		.collection('portfolioProjects')
		.findOne({ creatorId: creator._id, status: 'PUBLISHED', deletedAt: { $exists: false } });
	const comment = await db.collection('projectComments').findOne({ status: { $ne: 'DELETED' } });
	const originalCopy = await op('getSiteContent');
	const created = [];
	try {
		for (const kind of ['USERS', 'CREATORS', 'PROJECTS', 'SERVICES', 'COMMENTS']) {
			await op('adminDirectory', { kind }, undefined, true);
			await op('adminDirectory', { kind }, vt, true);
			const dir = await op('adminDirectory', { kind, input: { limit: 2 } }, at);
			assert.ok(dir.list.length <= 2);
			assert.ok(dir.metaCounter[0].total >= dir.list.length);
			assert.ok(dir.list.every((r) => !JSON.stringify(r).includes('passwordHash')));
		}
		await op('adminOverview', {}, undefined, true);
		await op('adminOverview', {}, vt, true);
		const overview = await op('adminOverview', {}, at);
		assert.equal(
			overview.projects,
			await db.collection('portfolioProjects').countDocuments({ deletedAt: { $exists: false } }),
		);
		const pg1 = await op('adminDirectory', { kind: 'PROJECTS', input: { page: 1, limit: 2 } }, at),
			pg2 = await op('adminDirectory', { kind: 'PROJECTS', input: { page: 2, limit: 2 } }, at);
		assert.ok(pg2.list.every((r) => !pg1.list.some((a) => a._id === r._id)));
		assert.equal((await op('adminDirectory', { kind: 'CREATORS', input: { search: 'mina-park' } }, at)).list.length, 1);
		assert.equal((await op('adminDirectory', { kind: 'PROJECTS', input: { search: '.*' } }, at)).list.length, 0);
		await op('adminDirectory', { kind: 'PROJECTS', input: { status: 'ACTIVE' } }, at, true);
		await op('adminDirectory', { kind: 'PROJECTS', input: { limit: 51 } }, at, true);
		checks.push('Protected directories, actual counts, pagination, literal search, valid filters and safe user fields');
		const mutations = [
			['adminUpdateUser', { id: String(originalUser._id), input: { displayName: 'Admin check user' } }],
			['adminSetUserStatus', { id: String(originalUser._id), status: 'SUSPENDED' }],
			['adminUpdateCreator', { id: String(creator._id), input: { headline: 'Admin check headline' } }],
			[
				'adminCreateProject',
				{ creatorId: String(creator._id), input: { title: 'Admin check draft', slug: 'admin-check-' + randomUUID() } },
			],
			['adminUpdateProject', { id: String(project._id), input: { title: 'Admin check project' } }],
			[
				'adminCreateService',
				{ creatorId: String(creator._id), input: { title: 'Admin check service', pricingType: 'CUSTOM_QUOTE' } },
			],
			[
				'adminUpdateService',
				{
					id: String((await db.collection('services').findOne({ creatorId: creator._id }))._id),
					input: { title: 'Admin check' },
				},
			],
			['adminSetRemoved', { kind: 'PROJECTS', id: String(project._id), removed: true }],
			['adminUpdateSiteContent', { input: originalCopy }],
		];
		for (const [name, variables] of mutations) {
			await op(name, variables, undefined, true);
			await op(name, variables, vt, true);
		}
		checks.push('Every new administrator mutation rejects anonymous and non-admin callers');
		await op('adminUpdateUser', { id: admin.user._id, input: { role: 'USER' } }, at, true);
		await op('adminSetUserStatus', { id: admin.user._id, status: 'SUSPENDED' }, at, true);
		await op('adminSetUserStatus', { id: admin.user._id, status: 'DELETED' }, at, true);
		await op(
			'adminUpdateUser',
			{ id: String(originalUser._id), input: { displayName: 'Admin check user', role: 'CREATOR' } },
			at,
		);
		let edited = await op('adminDirectory', { kind: 'USERS', input: { id: String(originalUser._id) } }, at);
		assert.equal(edited.list[0].user.role, 'CREATOR');
		for (const status of ['SUSPENDED', 'ACTIVE', 'DELETED', 'ACTIVE']) {
			const r = await op('adminSetUserStatus', { id: String(originalUser._id), status }, at);
			assert.equal(r.status, status);
			assert.equal(!!r.deletedAt, status === 'DELETED');
		}
		checks.push('Account edit, role changes, suspension, removal and recovery; self-lockout rejected');
		await op(
			'adminUpdateCreator',
			{ id: String(creator._id), input: { headline: 'Admin check headline' }, status: 'HIDDEN' },
			at,
		);
		await op('creator', { slug: 'mina-park' }, undefined, true);
		await op(
			'adminUpdateCreator',
			{ id: String(creator._id), input: { headline: creator.headline }, status: 'PUBLISHED' },
			at,
		);
		await op('creator', { slug: 'mina-park' });
		await op('adminUpdateCreator', { id: String(creator._id), input: { city: 'unsupported-city' } }, at, true);
		checks.push('Foreign creator edit, hide/republication and supported-city validation');
		const mediaUrl = `https://media.example.com/creatorhub/${creator.userId}/admin-check.png`;
		let draft = await op(
			'adminCreateProject',
			{
				creatorId: String(creator._id),
				input: {
					title: 'Admin validation project',
					slug: 'admin-check-' + randomUUID(),
					categoryId: String(project.categoryId),
					description: 'Disposable administrator validation project.',
					coverImageUrl: mediaUrl,
					media: [{ type: 'IMAGE', url: mediaUrl, altText: 'Validation image', sortOrder: 0 }],
				},
			},
			at,
		);
		created.push(['portfolioProjects', draft._id]);
		await op('adminUpdateProject', { id: draft._id, input: {}, status: 'PUBLISHED' }, at);
		assert.equal((await op('getProject', { projectId: draft._id })).status, 'PUBLISHED');
		await op(
			'adminUpdateProject',
			{ id: draft._id, input: { title: 'Updated admin validation' }, status: 'ARCHIVED' },
			at,
		);
		await op('getProject', { projectId: draft._id }, undefined, true);
		await op('adminSetRemoved', { kind: 'PROJECTS', id: draft._id, removed: true }, at);
		assert.ok(
			(await op('adminDirectory', { kind: 'PROJECTS', input: { id: draft._id, removed: true } }, at)).list[0].deletedAt,
		);
		await op('adminSetRemoved', { kind: 'PROJECTS', id: draft._id, removed: false }, at);
		const recovered = (await op('adminDirectory', { kind: 'PROJECTS', input: { id: draft._id } }, at)).list[0];
		assert.equal(recovered.status, 'ARCHIVED');
		assert.ok(!recovered.deletedAt);
		await op(
			'adminUpdateProject',
			{ id: draft._id, input: { coverImageUrl: 'https://evil.example/image.png' } },
			at,
			true,
		);
		await op(
			'adminUpdateProject',
			{
				id: draft._id,
				input: { coverImageUrl: `https://media.example.com/creatorhub/${admin.user._id}/wrong-owner.png` },
			},
			at,
			true,
		);
		await op(
			'adminUpdateProject',
			{
				id: draft._id,
				input: { media: [{ type: 'IMAGE', url: '/demo-media/not-owned.png', altText: 'No', sortOrder: 0 }] },
			},
			at,
			true,
		);
		const retained = await op(
			'adminUpdateProject',
			{
				id: String(project._id),
				input: {
					media: project.media.map((m, i) => ({
						type: m.type,
						url: m.url,
						altText: i === 0 ? 'Admin edited alt text' : m.altText,
						sortOrder: m.sortOrder,
					})),
				},
			},
			at,
		);
		assert.equal(retained.media[0].altText, 'Admin edited alt text');
		await op('updateProject', { projectId: draft._id, input: { title: 'Unowned' } }, at, true);
		checks.push(
			'Foreign project CRUD/publication/recovery; retained-media edits; replacement ownership and creator ownership remain enforced',
		);
		let service = await op(
			'adminCreateService',
			{
				creatorId: String(creator._id),
				input: {
					title: 'Admin validation service',
					categoryId: String(project.categoryId),
					description: 'Disposable service test.',
					pricingType: 'CUSTOM_QUOTE',
					deliverables: ['One test deliverable'],
				},
			},
			at,
		);
		created.push(['services', service._id]);
		for (const status of ['ACTIVE', 'PAUSED', 'ARCHIVED', 'ACTIVE'])
			assert.equal((await op('adminUpdateService', { id: service._id, input: {}, status }, at)).status, status);
		await op('adminUpdateService', { id: service._id, input: { pricingType: 'STARTING_AT' } }, at, true);
		await op('adminSetRemoved', { kind: 'SERVICES', id: service._id, removed: true }, at);
		await op('getService', { serviceId: service._id }, undefined, true);
		await op('adminSetRemoved', { kind: 'SERVICES', id: service._id, removed: false }, at);
		assert.equal(
			(await op('adminDirectory', { kind: 'SERVICES', input: { id: service._id } }, at)).list[0].status,
			'ARCHIVED',
		);
		await op('adminSetRemoved', { kind: 'CREATORS', id: String(creator._id), removed: true }, at);
		await op('creator', { slug: creator.slug }, undefined, true);
		await op('adminSetRemoved', { kind: 'CREATORS', id: String(creator._id), removed: false }, at);
		assert.equal(
			(await op('adminDirectory', { kind: 'CREATORS', input: { id: String(creator._id) } }, at)).list[0].status,
			'HIDDEN',
		);
		await op('adminUpdateCreator', { id: String(creator._id), input: {}, status: 'PUBLISHED' }, at);
		checks.push('Service activation, pause, archive and recoverable removal; creator recovery remains unpublished');
		if (comment) {
			const list = await op('adminDirectory', { kind: 'COMMENTS', input: { id: String(comment._id) } }, at);
			assert.ok(list.list[0].projectTitle);
			await op('moderateProjectComment', { commentId: String(comment._id), hidden: true }, at);
			await op('moderateProjectComment', { commentId: String(comment._id), hidden: false }, at);
		}
		checks.push('Comment directory provides project context and hide/restore moderation');
		const changed = {
			...originalCopy,
			homeHeading: 'Administrator validation heading',
			contactEmail: 'team@example.com',
			aboutText: 'Administrator validation About text.',
		};
		await op('adminUpdateSiteContent', { input: changed }, at);
		assert.equal((await op('getSiteContent')).homeHeading, changed.homeHeading);
		await op('adminUpdateSiteContent', { input: { ...changed, contactEmail: 'not an email' } }, at, true);
		await op('adminUpdateSiteContent', { input: { ...changed, homeHeading: '' } }, at, true);
		await op('adminUpdateSiteContent', { input: { ...changed, aboutText: null } }, at, true);
		checks.push('Saved public CMS copy; invalid email, empty heading and null About rejected');
		fs.writeFileSync(
			'docs/verification/admin.json',
			JSON.stringify({ passed: true, checks, operations: [...seen].sort() }, null, 2) + '\n',
		);
		console.log('PASS:', checks.length, 'admin verification groups;', seen.size, 'operations');
	} finally {
		await db.collection('users').replaceOne({ _id: originalUser._id }, originalUser);
		await db.collection('creatorProfiles').replaceOne({ _id: creator._id }, creator);
		await db.collection('portfolioProjects').replaceOne({ _id: project._id }, project);
		if (comment) await db.collection('projectComments').replaceOne({ _id: comment._id }, comment);
		await op('adminUpdateSiteContent', { input: originalCopy }, at);
		for (const [collection, id] of created) await db.collection(collection).deleteOne({ _id: new ObjectId(id) });
		const createdIds = created.filter(([c]) => c === 'portfolioProjects').map(([, id]) => new ObjectId(id));
		if (createdIds.length) {
			await db.collection('activityEvents').deleteMany({ projectId: { $in: createdIds } });
			await db.collection('notifications').deleteMany({ projectId: { $in: createdIds } });
		}
		await dbClient.close();
	}
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
