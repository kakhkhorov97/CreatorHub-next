const { approveDemoSubmission } = require('./approve-demo.cjs');
const fs = require('node:fs');
const path = require('node:path');
const { backendRequire } = require('./backend-path.cjs');
const root = path.resolve(__dirname, '..');
const { MongoClient, ObjectId } = backendRequire('mongodb');
const uri = process.env.DEMO_MONGO_URI || JSON.parse(fs.readFileSync(path.join(root, '.preview-db.json'))).uri;
const address = new URL(uri);
if (address.hostname !== '127.0.0.1' || address.pathname !== '/creatorhub_frontend_test') {
	throw new Error('This script only supports the local disposable creatorhub_frontend_test database.');
}
const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs/operations.json')));
const password = 'CreatorHub-demo-2026!';
const creators = [
	{
		name: 'Seo-jun Kang',
		slug: 'seo-jun-kang',
		city: 'seoul',
		category: 'Photography',
		headline: 'Portraits and product photography in natural light',
		skills: ['Portrait photography', 'Product photography'],
		service: 'Portrait photography session',
		description: 'A fictional demo session for individual and creative-team portraits.',
		deliverables: ['Planning call', 'Two-hour photo session', 'Ten edited photographs'],
		price: 350000,
	},
	{
		name: 'Hae-won Lee',
		slug: 'hae-won-lee',
		city: 'busan',
		category: 'Illustration',
		headline: 'Expressive illustrations for publications and brands',
		skills: ['Editorial illustration', 'Digital illustration'],
		service: 'Editorial illustration',
		description: 'A fictional demo illustration service for articles, publications and digital stories.',
		deliverables: ['Concept sketches', 'Two revision rounds', 'Print and digital artwork files'],
		price: 280000,
	},
	{
		name: 'Min-jae Song',
		slug: 'min-jae-song',
		city: 'seoul',
		category: 'Motion design',
		headline: 'Motion graphics with clear rhythm and storytelling',
		skills: ['Motion graphics', 'Title design'],
		service: 'Motion graphics sequence',
		description: 'A fictional demo service for a short animated graphic sequence.',
		deliverables: ['Storyboard', 'Animation draft', 'Final rendered sequence'],
		price: 750000,
	},
	{
		name: 'Da-eun Yoo',
		slug: 'da-eun-yoo',
		city: 'incheon',
		category: '3D design',
		headline: 'Tactile 3D imagery for products and visual identities',
		skills: ['3D modeling', 'Product visualization'],
		service: 'Product visualization',
		description: 'A fictional demo service for still product renders and materials.',
		deliverables: ['Model and material direction', 'Two preview renders', 'Three final high-resolution images'],
		price: 600000,
	},
	{
		name: 'Tae-ho Kim',
		slug: 'tae-ho-kim',
		city: 'daejeon',
		category: 'Video production',
		headline: 'Considered films for independent businesses',
		skills: ['Filmmaking', 'Video editing'],
		service: 'Short brand film',
		description: 'A fictional demo service for a short film introducing a business or creative project.',
		deliverables: ['Creative treatment', 'One filming day', 'Edited film'],
		price: 1200000,
	},
	{
		name: 'Soo-bin Jung',
		slug: 'soo-bin-jung',
		city: 'jeju',
		category: 'UX design',
		headline: 'Research-led experiences that make products easier to use',
		skills: ['User research', 'Interaction design'],
		service: 'UX review and prototype',
		description: 'A fictional demo service to review an existing journey and prototype improvements.',
		deliverables: ['Journey review', 'Prioritized findings', 'Interactive prototype'],
		price: 550000,
	},
];
async function op(name, variables = {}, token) {
	const response = await fetch('http://127.0.0.1:7001/graphql', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: JSON.stringify({ query: docs.find((d) => d.name === name).document, variables }),
	});
	const body = await response.json();
	if (body.errors) throw new Error(name + ': ' + JSON.stringify(body.errors));
	const value = body.data[name];
	return value && typeof value === 'object' && 'list' in value ? value.list : value;
}
(async () => {
	const mongo = new MongoClient(uri);
	await mongo.connect();
	try {
		const db = mongo.db('creatorhub_frontend_test');
		const admin = await op('login', {
			input: { email: 'admin@frontend.test', password: 'Frontend-test-password-123' },
		});
		const categories = await op('categories');
		const manifest = JSON.parse(fs.readFileSync(path.join(root, 'docs/portrait-assets.json')));
		for (let i = 0; i < creators.length; i++) {
			const person = creators[i];
			const email = person.slug + '@creatorhub.example';
			let category = categories.find((c) => c.name === person.category);
			if (!category) {
				category = await op(
					'createCategory',
					{
						input: {
							name: person.category,
							slug: person.category.toLowerCase().replaceAll(' ', '-'),
							sortOrder: 8 + i,
						},
					},
					admin.accessToken,
				);
				categories.push(category);
			}
			let account;
			const existing = await db.collection('users').findOne({ displayName: person.name });
			if (existing) account = await op('login', { input: { email, password } });
			else {
				account = await op('register', { input: { email, password, displayName: person.name } });
				await db
					.collection('authIdentities')
					.updateOne(
						{ userId: new ObjectId(account.user._id), provider: 'EMAIL' },
						{ $set: { verifiedAt: new Date() } },
					);
			}
			const owned = await db.collection('creatorProfiles').findOne({ userId: new ObjectId(account.user._id) });
			if (!owned) {
				await op(
					'createCreatorProfile',
					{
						input: {
							slug: person.slug,
							headline: person.headline,
							city: person.city,
							bio: `${
								person.name
							} is a fictional demo creator working in ${person.category.toLowerCase()}. This sample profile is provided to explore CreatorHub profiles, services and inquiries.`,
							categoryIds: [category._id],
							skills: person.skills,
							remoteAvailable: i !== 0 && i !== 4,
							availability: 'AVAILABLE',
						},
					},
					account.accessToken,
				);
				await op('setCreatorProfileStatus', { status: 'PUBLISHED' }, account.accessToken);
				await approveDemoSubmission(op, account.accessToken, admin.accessToken);
			}
			const services = await op('getMyServices', {}, account.accessToken);
			if (!services.some((s) => s.title === person.service)) {
				const service = await op(
					'createService',
					{
						input: {
							title: person.service,
							categoryId: category._id,
							description: person.description,
							pricingType: 'STARTING_AT',
							startingPrice: person.price,
							estimatedDays: 7 + i,
							deliverables: person.deliverables,
						},
					},
					account.accessToken,
				);
				await op('setServiceStatus', { serviceId: service._id, status: 'ACTIVE' }, account.accessToken);
				await approveDemoSubmission(op, account.accessToken, admin.accessToken);
			}
		}
		for (const portrait of manifest.portraits) {
			const profile = await db.collection('creatorProfiles').findOne({ slug: portrait.slug });
			if (!profile) throw new Error('Missing profile: ' + portrait.slug);
			const file = path.resolve(
				root,
				'../creatorhub-backend-starter/public/demo-media',
				portrait.slug + '-portrait.png',
			);
			if (!fs.existsSync(file)) throw new Error('Missing portrait: ' + file);
			await db
				.collection('users')
				.updateOne({ _id: profile.userId }, { $set: { avatarUrl: '/demo-media/' + portrait.slug + '-portrait.png' } });
		}
		await db.collection('creatorProfiles').updateOne({ slug: 'studio-test' }, { $set: { status: 'DRAFT' } });
		const records = await db
			.collection('creatorProfiles')
			.find({
				status: 'PUBLISHED',
				deletedAt: null,
				slug: { $in: ['mina-park', ...manifest.portraits.map((p) => p.slug)] },
			})
			.toArray();
		const accounts = [];
		for (const record of records) {
			const user = await db.collection('users').findOne({ _id: record.userId });
			if (user) accounts.push(`- ${user.displayName} (Creator): ${record.slug}@creatorhub.example`);
		}
		const clientNames = ['Alex Jung', 'Dami Shin', 'Rowan Cho', 'Sumin Kang'];
		accounts.push(...clientNames.map((name, i) => `- ${name} (Client): client-${i + 1}@creatorhub.example`));
		fs.writeFileSync(
			path.join(root, 'docs/DEMO_ACCOUNTS.md'),
			'# Fictional demo accounts\n\nAll creators, clients and services are fictional. Creator portraits are AI-generated. Preview password: `' +
				password +
				'`. Use Email sign-in.\n\n' +
				accounts.join('\n') +
				'\n\nRestore this disposable preview by running seed-demo.cjs, style-demo.cjs, then expand-demo.cjs. The database is temporary and disappears when the preview backend stops. No production database is modified.\n',
		);
		console.log(
			JSON.stringify({
				categories: categories.length,
				addedCategories: creators.map((c) => c.category),
				demoCreators: manifest.portraits.length + 1,
				newCreators: creators.length,
				newServices: creators.length,
			}),
		);
	} finally {
		await mongo.close();
	}
})().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
