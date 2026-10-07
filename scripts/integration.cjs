const { approveDemoSubmission } = require('./approve-demo.cjs');
// Runs against a disposable MongoDB replica set. It never connects to the user's database.
const path = require('path');
const fs = require('fs');
const assert = require('node:assert/strict');
const { createRequire } = require('module');
const { randomUUID } = require('crypto');
const backend = process.env.CREATORHUB_BACKEND_PATH || '/Users/kakhkhorov/Desktop/creatorhub-backend-starter';
const req = createRequire(path.join(backend, 'package.json'));
process.env.TS_NODE_PROJECT = path.join(backend, 'tsconfig.json');
req('ts-node').register({
	transpileOnly: true,
	compiler: req.resolve('typescript'),
	project: process.env.TS_NODE_PROJECT,
});
req('reflect-metadata');
const { MongoMemoryReplSet } = req('mongodb-memory-server');
const { Test } = req('@nestjs/testing');
const { ValidationPipe } = req('@nestjs/common');
const { getConnectionToken } = req('@nestjs/mongoose');
const docs = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/operations.json'), 'utf8'));
const seen = new Set();
const mail = new Map();
const port = Number(process.env.TEST_API_PORT || 7001);
let mongo, app;
async function op(name, variables = {}, token, expectError = false) {
	const response = await fetch(`http://localhost:${port}/graphql`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: JSON.stringify({ query: docs.find((d) => d.name === name).document, variables }),
	});
	const body = await response.json();
	if (expectError) {
		assert.ok(body.errors, name + ' should fail');
		return body;
	}
	assert.ok(!body.errors, name + ': ' + JSON.stringify(body.errors));
	seen.add(name);
	const value = body.data[name];
	return value && typeof value === 'object' && 'list' in value ? value.list : value;
}
(async () => {
	mongo = await MongoMemoryReplSet.create({
		replSet: { count: 1, storageEngine: 'wiredTiger' },
		binary: { systemBinary: path.join(backend, '.local/mongodb/mongod-arm64-darwin-7.0.24') },
	});
	process.env.NODE_ENV = 'test';
	process.env.MONGO_DEV = mongo.getUri('creatorhub_frontend_test');
	process.env.JWT_SECRET = 'disposable-frontend-test-secret-not-for-deployment';
	process.env.FRONTEND_URL = process.env.TEST_FRONTEND_URL || 'http://localhost:7007';
	process.env.MEDIA_BASE_URL = 'https://media.example.com/creatorhub';
	process.env.MAIL_WEBHOOK_URL = '';
	process.env.MAIL_WEBHOOK_TOKEN = '';
	process.env.DISCOVERY_PARSER_URL = '';
	const { AppModule } = req(path.join(backend, 'apps/Creator-api/src/app.module.ts'));
	const { MailService } = req(path.join(backend, 'apps/Creator-api/src/components/auth/mail.service.ts'));
	const module = await Test.createTestingModule({ imports: [AppModule] })
		.overrideProvider(MailService)
		.useValue({ sendToken: async (email, purpose, token) => mail.set(email + ':' + purpose, token) })
		.compile();
	app = module.createNestApplication({ logger: false });
	const { configureUploads } = req(path.join(backend, 'apps/Creator-api/src/components/upload/upload.middleware.ts'));
	configureUploads(app);
	app.useGlobalPipes(
		new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true }),
	);
	app.enableCors({ origin: ['http://localhost:7007', 'http://localhost:7017'] });
	await app.listen(port, '127.0.0.1');
	const db = app.get(getConnectionToken());
	for (const model of Object.values(db.models)) await model.createIndexes();
	const password = 'Frontend-test-password-123';
	async function account(email, displayName) {
		const user = await op('register', { input: { email, password, displayName } });
		await op('verifyEmail', { token: mail.get(email + ':EMAIL_VERIFY') });
		return user;
	}
	const creator = await account('creator@frontend.test', 'Studio Test');
	const client = await account('client@frontend.test', 'Client Test');
	const admin = await account('admin@frontend.test', 'Admin Test');
	await db.model('User').updateOne({ _id: admin.user._id }, { $set: { role: 'ADMIN' } });
	let ct = creator.accessToken;
	const ut = client.accessToken,
		at = admin.accessToken;
	await op('apiName');
	await op('me', {}, ct);
	await op('login', { input: { email: 'client@frontend.test', password } });
	for (const preferredLocale of ['ko', 'uz', 'en']) {
		const updated = await op('updateMe', { input: { displayName: 'Studio Test', preferredLocale } }, ct);
		assert.equal(updated.preferredLocale, preferredLocale);
	}

	const phone = await op('registerPhone', {
		input: { phoneNumber: '+821012345678', password, displayName: 'Preview Creator' },
	});
	await op('loginPhone', { input: { phoneNumber: '+821012345678', password } });
	await op('requestEmailVerification', { input: { email: 'client@frontend.test' } });
	await op('requestPasswordReset', { input: { email: 'client@frontend.test' } });
	await op('resetPassword', { input: { token: mail.get('client@frontend.test:PASSWORD_RESET'), password } });
	const freshClient = await op('login', { input: { email: 'client@frontend.test', password } });
	const clientToken = freshClient.accessToken;
	const refreshed = await op('refreshSession', { refreshToken: freshClient.refreshToken });
	const activeClient = refreshed.accessToken;
	await op('getMyAuthIdentities', {}, ct);
	const extra = await op('linkPhone', { input: { phoneNumber: '+821087654321', password } }, ct);
	await op('changePhonePassword', { input: { password } }, ct);
	ct = (await op('login', { input: { email: 'creator@frontend.test', password } })).accessToken;
	await op('unlinkAuthIdentity', { authIdentityId: extra._id }, ct);
	await op('linkEmail', { input: { email: 'phone@frontend.test', password } }, phone.accessToken);
	await op('verifyEmail', { token: mail.get('phone@frontend.test:EMAIL_VERIFY') });
	const category = await op('createCategory', { input: { slug: 'brand-design', name: 'Branding' } }, at);
	await op('updateCategory', { id: category._id, input: { description: 'Brand identity and packaging' } }, at);
	await op('categories');
	await op('adminCategories', {}, at);
	await op('getCities');
	let profile = await op(
		'createCreatorProfile',
		{ input: { slug: 'studio-test', headline: 'Brand designer', city: 'seoul', categoryIds: [category._id] } },
		ct,
	);
	// Use the backend's actual city keys, never invented UI values.
	const cities = await op('getCities');
	if (!cities.some((c) => c.key === 'seoul')) throw new Error('Unexpected city fixture');
	await op(
		'updateCreatorProfile',
		{
			input: {
				bio: 'Independent studio for thoughtful brands.',
				skills: ['Brand identity', 'Packaging'],
				remoteAvailable: true,
			},
		},
		ct,
	);
	await op('setCreatorProfileStatus', { status: 'PUBLISHED' }, ct);
	await approveDemoSubmission(op, ct, at);
	await op('myCreatorProfile', {}, ct);
	await op('creator', { slug: 'studio-test' });
	const cover = `https://media.example.com/creatorhub/${creator.user._id}/cover.jpg`;
	let project = await op(
		'createProject',
		{
			input: {
				title: 'Botanical identity',
				slug: 'botanical-identity',
				categoryId: category._id,
				description: 'A considered identity for a botanical studio.',
				summary: 'Brand identity and packaging.',
				coverImageUrl: cover,
				media: [{ type: 'IMAGE', url: cover, altText: 'Botanical brand identity', sortOrder: 0 }],
				tags: ['branding', 'packaging'],
			},
		},
		ct,
	);
	await op(
		'updateProject',
		{ projectId: project._id, input: { summary: 'Visual identity for a botanical studio.' } },
		ct,
	);
	await op('setProjectStatus', { projectId: project._id, status: 'PUBLISHED' }, ct);
	await approveDemoSubmission(op, ct, at);
	await op('getProject', { projectId: project._id });
	await op('getMyProjects', {}, ct);
	await op('getProjects', { input: { query: 'Botanical', limit: 12 } });
	let service = await op(
		'createService',
		{
			input: {
				title: 'Brand identity design',
				categoryId: category._id,
				description: 'A complete visual identity for your project.',
				pricingType: 'STARTING_AT',
				startingPrice: 800000,
				deliverables: ['Logo', 'Visual identity', 'Brand guidelines'],
				estimatedDays: 14,
			},
		},
		ct,
	);
	await op(
		'updateService',
		{ serviceId: service._id, input: { description: 'Logo, visual identity, and brand guidelines.' } },
		ct,
	);
	await op('setServiceStatus', { serviceId: service._id, status: 'ACTIVE' }, ct);
	await approveDemoSubmission(op, ct, at);
	await op('getService', { serviceId: service._id });
	await op('getMyServices', {}, ct);
	await op('getServices', { input: { creatorId: profile._id } });
	await op('getCreators');
	await op('discoverCreators', { input: { request: 'Brand designer in Seoul' } });
	await op('setCreatorFollow', { creatorId: profile._id, following: true }, activeClient);
	await op('getMyFollows', {}, activeClient);
	assert.equal(await op('getMyProjectLike', { projectId: project._id }, activeClient), false);
	await op('setProjectLike', { projectId: project._id, liked: true }, activeClient);
	assert.equal(await op('getMyProjectLike', { projectId: project._id }, activeClient), true);
	await op('setProjectLike', { projectId: project._id, liked: false }, activeClient);
	assert.equal(await op('getMyProjectLike', { projectId: project._id }, activeClient), false);
	await op('getMyProjectLike', { projectId: project._id }, undefined, true);
	await op('setProjectLike', { projectId: project._id, liked: true }, activeClient);
	await op('getProjectLikeCount', { projectId: project._id });
	await op('setProjectSaved', { projectId: project._id, saved: true }, activeClient);
	await op('getSavedProjects', {}, activeClient);
	const comment = await op(
		'createProjectComment',
		{ input: { projectId: project._id, clientCommentKey: randomUUID(), content: 'Thoughtful work.' } },
		activeClient,
	);
	await op(
		'editProjectComment',
		{ commentId: comment._id, input: { content: 'Thoughtful identity and packaging.' } },
		activeClient,
	);
	await op('getProjectComments', { projectId: project._id });
	await op('moderateProjectComment', { commentId: comment._id, hidden: true }, at);
	await op('moderateProjectComment', { commentId: comment._id, hidden: false }, at);
	await op('deleteProjectComment', { commentId: comment._id }, activeClient);
	const draft = () =>
		op(
			'createInquiry',
			{
				input: {
					creatorId: profile._id,
					serviceId: service._id,
					subject: 'Brand identity inquiry',
					brief: 'We need a visual identity for an independent bookstore.',
					budgetMin: 500000,
					budgetMax: 1000000,
				},
			},
			activeClient,
		);
	const version = (i) => ({ inquiryId: i._id, expectedVersion: i.version });
	let inquiry = await draft();
	inquiry = await op(
		'updateInquiry',
		{ input: { ...version(inquiry), subject: 'Identity for a new bookstore' } },
		activeClient,
	);
	await op('getInquiry', { inquiryId: inquiry._id }, activeClient);
	await op('getInquiries', {}, activeClient);
	inquiry = await op('submitInquiry', { input: version(inquiry) }, activeClient);
	assert.equal(await op('getUnreadInquiryCount', {}, ct), 1, 'recipient inbox badge');
	assert.equal(await op('getUnreadInquiryCount', {}, activeClient), 0, 'sender has no incoming alert');
	const received = await op('getInquiries', { creatorInbox: true }, ct);
	assert.ok(received.some((row) => row._id === inquiry._id && row.unreadCount === 1 && row.counterpartyName));
	await op('markInquiryRead', { input: version(inquiry) }, admin.accessToken, true);
	await op('markInquiryRead', { input: version(inquiry) }, ct);
	assert.equal(await op('getUnreadInquiryCount', {}, ct), 0);

	await op(
		'updateInquiry',
		{ input: { ...version(inquiry), subject: 'Cannot edit sent inquiry' } },
		activeClient,
		true,
	);
	const messageKey = randomUUID();
	const m = await op(
		'sendInquiryMessage',
		{
			input: {
				...version(inquiry),
				clientMessageKey: messageKey,
				body: 'Thank you. Let’s discuss the scope and timeline.',
			},
		},
		ct,
	);
	const duplicate = await op(
		'sendInquiryMessage',
		{
			input: {
				...version(inquiry),
				clientMessageKey: messageKey,
				body: 'Thank you. Let’s discuss the scope and timeline.',
			},
		},
		ct,
	);
	assert.equal(m._id, duplicate._id, 'message retry must not duplicate');
	assert.equal(await op('getUnreadInquiryCount', {}, activeClient), 1, 'reply alerts customer');
	await op('markInquiryRead', { input: version(inquiry) }, activeClient);
	assert.equal(await op('getUnreadInquiryCount', {}, activeClient), 1, 'stale read keeps newer reply unread');
	const latest = await op('getInquiry', { inquiryId: inquiry._id }, activeClient);
	await op('markInquiryRead', { input: version(latest) }, activeClient);
	assert.equal(await op('getUnreadInquiryCount', {}, activeClient), 0);

	await op('markInquiryMessageRead', { messageId: m._id }, activeClient);
	await op('getInquiryMessages', { inquiryId: inquiry._id }, activeClient);
	await op('getInquiryEvents', { inquiryId: inquiry._id }, ct);
	inquiry = await op('getInquiry', { inquiryId: inquiry._id }, activeClient);
	inquiry = await op('closeInquiry', { input: { ...version(inquiry), outcome: 'AGREED_TO_PROCEED' } }, activeClient);
	inquiry = await op('completeInquiry', { input: version(inquiry) }, activeClient);
	await op(
		'createServiceFeedback',
		{ input: { inquiryId: inquiry._id, rating: 5, feedback: 'Thoughtful work and clear communication.' } },
		activeClient,
	);
	await op('getInquiryFeedback', { inquiryId: inquiry._id }, activeClient);
	await op('getCreatorFeedback', { creatorId: profile._id });
	const request = {
		creatorId: profile._id,
		subject: 'Direct inquiry',
		brief: 'Please help design the identity for a new bookstore.',
		clientRequestKey: randomUUID(),
	};
	const direct = await op('sendInquiry', { input: request }, activeClient);
	assert.equal(direct.status, 'SENT');
	assert.equal((await op('sendInquiry', { input: request }, activeClient))._id, direct._id);

	const secondProfile = await op(
		'createCreatorProfile',
		{
			input: { slug: 'preview-creator', headline: 'Editorial designer', city: 'gwangju', categoryIds: [category._id] },
		},
		phone.accessToken,
	);
	await op(
		'updateCreatorProfile',
		{
			input: {
				bio: 'Independent editorial designer for clear, thoughtful publications.',
				skills: ['Editorial design'],
				remoteAvailable: true,
			},
		},
		phone.accessToken,
	);
	await op('setCreatorProfileStatus', { status: 'PUBLISHED' }, phone.accessToken);
	await approveDemoSubmission(op, phone.accessToken, at);
	const outgoing = await op(
		'sendInquiry',
		{
			input: {
				creatorId: secondProfile._id,
				subject: 'Editorial collaboration',
				brief: 'Could you help our studio design a small portfolio booklet?',
				clientRequestKey: randomUUID(),
			},
		},
		ct,
	);
	const privateDraft = await op(
		'createInquiry',
		{ input: { creatorId: profile._id, subject: 'Private unsubmitted brief' } },
		phone.accessToken,
	);
	const combined = await op('getInquiries', { allConversations: true }, ct);
	assert.ok(
		combined.some((i) => i._id === direct._id),
		'combined inbox includes received inquiries',
	);
	assert.ok(
		combined.some((i) => i._id === outgoing._id),
		'combined inbox includes sent inquiries',
	);
	assert.ok(!combined.some((i) => i._id === privateDraft._id), 'recipient cannot see unsubmitted drafts');
	const phoneInbox = await op('getInquiries', { allConversations: true }, phone.accessToken);
	assert.ok(phoneInbox.some((i) => i._id === outgoing._id));
	assert.ok(!phoneInbox.some((i) => i._id === direct._id), 'combined inbox excludes unrelated conversations');
	assert.equal(
		(await op('getInquiries', { allConversations: true }, at)).length,
		0,
		'admin does not gain private inbox access',
	);

	let cancel = await draft();
	cancel = await op('submitInquiry', { input: version(cancel) }, activeClient);
	await op('cancelInquiry', { input: version(cancel) }, activeClient);
	let decline = await draft();
	decline = await op('submitInquiry', { input: version(decline) }, activeClient);
	await op('declineInquiry', { input: version(decline) }, ct);
	const deleted = await draft();
	await op('deleteInquiryDraft', { input: version(deleted) }, activeClient);
	const notes = await op('getNotifications', {}, ct);
	await op('getUnreadNotificationCount', {}, ct);
	if (notes[0]) await op('markNotificationRead', { notificationId: notes[0]._id }, ct);
	await op('setAccountSuspended', { userId: client.user._id, suspended: true }, at);
	await op('me', {}, activeClient, true);
	await op('setAccountSuspended', { userId: client.user._id, suspended: false }, at);
	const disposableProject = await op('createProject', { input: { title: 'Disposable', slug: 'disposable' } }, ct);
	await op('deleteProject', { projectId: disposableProject._id }, ct);
	const disposableService = await op('createService', { input: { title: 'Disposable' } }, ct);
	await op('deleteService', { serviceId: disposableService._id }, ct);
	const disposable = await account('delete@frontend.test', 'Delete Test');
	await op('createCreatorProfile', { input: { slug: 'disposable-profile' } }, disposable.accessToken);
	await op('deleteCreatorProfile', {}, disposable.accessToken);
	await op('deleteMyAccount', {}, disposable.accessToken);
	const websocketChecks = await require('./verify-messaging.cjs').verifyMessaging({
		port,
		op,
		customer: (await op('login', { input: { email: 'client@frontend.test', password } })).accessToken,
		creator: ct,
		outsider: phone.accessToken,
		admin: at,
		inquiryId: direct._id,
		draftId: privateDraft._id,
	});
	websocketChecks.push(
		...(await require('./verify-messaging-sessions.cjs').verifyMessagingSessions({
			port,
			op,
			backendRequire: req,
			password,
		})),
	);
	console.log('WebSocket checks: ' + websocketChecks.join('; '));
	const logout = await op('login', { input: { email: 'admin@frontend.test', password } });
	await op('logout', {}, logout.accessToken);
	await op('me', {}, logout.accessToken, true);
	const report = {
		passed: Array.from(seen).sort(),
		notExecuted: docs.map((d) => d.name).filter((n) => !seen.has(n)),
		websocketChecks,
		assertions: [
			'All executed requests use the generated frontend documents',
			'Inquiry duplicate retry returns same message',
			'Sent inquiry cannot be edited',
			'Suspended account denied',
			'Logged-out token denied',
		],
		environment:
			'Disposable MongoDB replica set; real CreatorHub resolvers; mail captured in memory; no real social providers',
	};
	fs.mkdirSync(path.join(__dirname, '../docs/verification'), { recursive: true });
	fs.writeFileSync(path.join(__dirname, '../docs/verification/integration.json'), JSON.stringify(report, null, 2));
	console.log(`PASS: ${seen.size}/${docs.length} operations exercised. Not executed: ${report.notExecuted.join(', ')}`);
	if (process.env.KEEP_TEST_SERVER === '1') {
		fs.writeFileSync(
			path.join(__dirname, '../.preview-db.json'),
			JSON.stringify({ uri: mongo.getUri('creatorhub_frontend_test') }),
		);
		console.log('Disposable preview API ready on ' + port + '. Test phone login: +821012345678 / ' + password);
		process.on('SIGTERM', () => shutdown());
		process.on('SIGINT', () => shutdown());
		return;
	}
	await shutdown();
})().catch(async (error) => {
	console.error(error.message);
	await shutdown();
	process.exitCode = 1;
});
async function shutdown() {
	if (app) await app.close();
	if (mongo) await mongo.stop();
}
