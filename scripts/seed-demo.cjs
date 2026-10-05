const { approveDemoSubmission } = require('./approve-demo.cjs');
const fs = require('fs'),
	path = require('path'),
	{ createRequire } = require('module'),
	{ randomUUID } = require('crypto');
const root = '/Users/kakhkhorov/Desktop/CreatorHUb-FrontEnd';
const req = createRequire('/Users/kakhkhorov/Desktop/creatorhub-backend-starter/package.json');
const { MongoClient, ObjectId } = req('mongodb');
const uri = process.env.DEMO_MONGO_URI;
if (!uri || !uri.includes('/creatorhub_frontend_test'))
	throw Error('Only the disposable creatorhub_frontend_test database is permitted');
const docs = JSON.parse(fs.readFileSync(path.join(root, 'docs/operations.json')));
const password = 'CreatorHub-demo-2026!';
async function op(name, variables = {}, token) {
	let r = await fetch('http://127.0.0.1:7001/graphql', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: JSON.stringify({ query: docs.find((d) => d.name === name).document, variables }),
	});
	let b = await r.json();
	if (b.errors) throw Error(name + ': ' + JSON.stringify(b.errors));
	return b.data[name] && typeof b.data[name] === 'object' && 'list' in b.data[name] ? b.data[name].list : b.data[name];
}
const people = [
	[
		'Mina Park',
		'mina-park',
		'seoul',
		'Branding',
		'Identity systems for independent brands',
		['Brand identity', 'Packaging'],
		'MORNING / FORM',
		'Onda coffee identity',
		'#e6ddd0',
		'#283f35',
	],
	[
		'Joon Lee',
		'joon-lee',
		'busan',
		'Editorial design',
		'Books, publications and considered typography',
		['Editorial design', 'Typography'],
		'SLOW / JOURNAL',
		'Slow Journal issue 01',
		'#f0a74c',
		'#4b302a',
	],
	[
		'Sora Kim',
		'sora-kim',
		'seoul',
		'Product design',
		'Digital products with clear, useful interfaces',
		['UI design', 'Design systems'],
		'DAY / PLAN',
		'Dayplan product concept',
		'#d8e4ee',
		'#293d74',
	],
	[
		'Hana Choi',
		'hana-choi',
		'jeju',
		'Art direction',
		'Art direction for culture and hospitality',
		['Art direction', 'Visual systems'],
		'ISLAND / NOTES',
		'Island Notes visual identity',
		'#e9dfc9',
		'#bf543c',
	],
	[
		'Noah Han',
		'noah-han',
		'incheon',
		'Graphic design',
		'Bold graphic systems for events and spaces',
		['Poster design', 'Typography'],
		'MOVE / 2026',
		'Move festival poster series',
		'#cbd645',
		'#22282d',
	],
	[
		'Yuna Seo',
		'yuna-seo',
		'seoul',
		'Packaging',
		'Packaging that makes everyday objects memorable',
		['Packaging', 'Brand identity'],
		'BARE / ESSENTIALS',
		'Bare Essentials packaging',
		'#e9c5bd',
		'#733f4c',
	],
	[
		'Jiho Moon',
		'jiho-moon',
		'daejeon',
		'Digital design',
		'Web experiences for small creative businesses',
		['Web design', 'Responsive design'],
		'STUDIO / INDEX',
		'Studio Index website concept',
		'#c7d6e0',
		'#253948',
	],
	[
		'Eun Lim',
		'eun-lim',
		'busan',
		'Typography',
		'Type-led identities and editorial experiments',
		['Typography', 'Editorial design'],
		'TYPE / STUDIES',
		'Type Studies collection',
		'#d6c9e6',
		'#483b67',
	],
];
function svg(title, sub, bg, ink, variant = 0) {
	const words = title.split(' / ');
	return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="${bg}"/><g fill="${ink}">${
		variant % 2
			? '<circle cx="950" cy="210" r="150" fill="none" stroke="' +
			  ink +
			  '" stroke-width="45"/><path d="M80 700H1120M80 720H1120" stroke="' +
			  ink +
			  '" stroke-width="2"/>'
			: '<rect x="810" y="120" width="260" height="540" rx="130" fill="none" stroke="' +
			  ink +
			  '" stroke-width="35"/><circle cx="940" cy="390" r="78"/>'
	}<text x="80" y="115" font-family="Arial,sans-serif" font-size="22" letter-spacing="5">${sub.toUpperCase()}</text><text x="72" y="410" font-family="Georgia,serif" font-size="115">${
		words[0]
	}</text><text x="72" y="535" font-family="Georgia,serif" font-size="115">${
		words[1]
	}</text><text x="80" y="817" font-family="Arial,sans-serif" font-size="20" letter-spacing="3">CREATORHUB · FICTIONAL PORTFOLIO STUDY</text></g></svg>`;
}
(async () => {
	const mongo = new MongoClient(uri);
	await mongo.connect();
	try {
		const db = mongo.db('creatorhub_frontend_test');
		const admin = await op('login', {
			input: { email: 'admin@frontend.test', password: 'Frontend-test-password-123' },
		});
		let cats = await op('categories');
		const folder = path.resolve(root, '../creatorhub-backend-starter/public/demo-media');
		fs.mkdirSync(folder, { recursive: true });
		const all = [];
		const accounts = [];
		for (let i = 0; i < people.length; i++) {
			const [name, slug, city, cat, headline, skills, title, projectTitle, bg, ink] = people[i];
			const email = slug + '@creatorhub.example';
			let a;
			try {
				a = await op('login', { input: { email, password } });
			} catch {
				a = await op('register', { input: { email, password, displayName: name } });
				await db
					.collection('authIdentities')
					.updateOne({ userId: new ObjectId(a.user._id), provider: 'EMAIL' }, { $set: { verifiedAt: new Date() } });
			}
			let category = cats.find((c) => c.name === cat);
			if (!category) {
				category = await op(
					'createCategory',
					{ input: { name: cat, slug: cat.toLowerCase().replaceAll(' ', '-') } },
					admin.accessToken,
				);
				cats.push(category);
			}
			let profile;
			try {
				profile = await op('myCreatorProfile', {}, a.accessToken);
			} catch (e) {
				if (!e.message.includes('Record not found')) throw e;
			}
			if (!profile) {
				profile = await op(
					'createCreatorProfile',
					{
						input: {
							slug,
							headline,
							city,
							bio: `${name} is a fictional demo creator focused on ${skills
								.join(' and ')
								.toLowerCase()}. This sample profile lets you explore portfolios, services and project inquiries.`,
							categoryIds: [category._id],
							skills,
							remoteAvailable: i % 3 !== 0,
							availability: 'AVAILABLE',
						},
					},
					a.accessToken,
				);
				await op('setCreatorProfileStatus', { status: 'PUBLISHED' }, a.accessToken);
				await approveDemoSubmission(op, a.accessToken, admin.accessToken);
			}
			const avatar = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="160" height="160" rx="80" fill="${bg}"/><text x="80" y="99" text-anchor="middle" font-family="Arial,sans-serif" font-size="53" fill="${ink}">${name
				.split(' ')
				.map((s) => s[0])
				.join('')}</text></svg>`;
			fs.writeFileSync(path.join(folder, slug + '.svg'), avatar);
			await db
				.collection('users')
				.updateOne({ _id: new ObjectId(a.user._id) }, { $set: { avatarUrl: `/demo-media/${slug}.svg` } });
			const own = await op('getMyProjects', {}, a.accessToken);
			const services = await op('getMyServices', {}, a.accessToken);
			let made = [];
			for (let j = 0; j < 2; j++) {
				const ps = slug + '-' + j;
				const label = j ? projectTitle + ' — visual studies' : projectTitle;
				fs.writeFileSync(
					path.join(folder, ps + '.svg'),
					svg(j ? title.split(' / ').reverse().join(' / ') : title, cat, j ? ink : bg, j ? bg : ink, i + j),
				);
				let p = own.find((p) => p.slug === ps);
				if (!p) {
					const url = `https://media.example.com/creatorhub/${a.user._id}/${ps}.png`;
					p = await op(
						'createProject',
						{
							input: {
								title: label,
								slug: ps,
								categoryId: category._id,
								summary: j
									? 'Exploring type, rhythm and a flexible graphic language.'
									: 'A complete visual direction for a fictional creative brief.',
								description: `${label} is a self-initiated demo portfolio project by ${name}. The study explores ${skills
									.join(', ')
									.toLowerCase()} through a restrained palette, typography and a repeatable visual system. No real client or commercial commission is implied.`,
								coverImageUrl: url,
								media: [{ type: 'IMAGE', url, altText: label, sortOrder: 0 }],
								tags: skills.map((s) => s.toLowerCase()),
							},
						},
						a.accessToken,
					);
					await op('setProjectStatus', { projectId: p._id, status: 'PUBLISHED' }, a.accessToken);
					await approveDemoSubmission(op, a.accessToken, admin.accessToken);
				}
				const local = `/demo-media/${ps}.svg`;
				await db
					.collection('portfolioProjects')
					.updateOne({ _id: new ObjectId(p._id) }, { $set: { coverImageUrl: local, 'media.0.url': local } });
				made.push(p);
			}
			let madeServices = [];
			for (let j = 0; j < 2; j++) {
				const st = j ? `${skills[0]} consultation` : `${skills[0]} package`;
				let service = services.find((s) => s.title === st);
				if (!service) {
					service = await op(
						'createService',
						{
							input: {
								title: st,
								categoryId: category._id,
								description: j
									? 'A focused review of your brief, current direction and next steps. Demo service for testing inquiries.'
									: `A collaborative ${skills[0].toLowerCase()} process from initial direction to prepared final files. Demo service for testing inquiries.`,
								pricingType: 'STARTING_AT',
								startingPrice: j ? 120000 + i * 15000 : 650000 + i * 125000,
								estimatedDays: j ? 3 : 14 + i,
								deliverables: j
									? ['Brief review', '60-minute consultation', 'Written recommendations']
									: ['Two initial directions', 'Two revision rounds', 'Final files and handover guide'],
							},
						},
						a.accessToken,
					);
					await op('setServiceStatus', { serviceId: service._id, status: 'ACTIVE' }, a.accessToken);
					await approveDemoSubmission(op, a.accessToken, admin.accessToken);
				}
				madeServices.push(service);
			}
			all.push({ a, profile, projects: made, services: madeServices });
			accounts.push({ name, email, role: 'Creator' });
		}
		for (let i = 0; i < 4; i++) {
			const name = ['Alex Jung', 'Dami Shin', 'Rowan Cho', 'Sumin Kang'][i],
				email = `client-${i + 1}@creatorhub.example`;
			let a;
			try {
				a = await op('login', { input: { email, password } });
			} catch {
				a = await op('register', { input: { email, password, displayName: name } });
				await db
					.collection('authIdentities')
					.updateOne({ userId: new ObjectId(a.user._id), provider: 'EMAIL' }, { $set: { verifiedAt: new Date() } });
			}
			accounts.push({ name, email, role: 'Client' });
			for (let j = 0; j < all.length; j++) {
				if ((i + j) % 2 === 0) {
					await op('setCreatorFollow', { creatorId: all[j].profile._id, following: true }, a.accessToken);
					await op('setProjectLike', { projectId: all[j].projects[0]._id, liked: true }, a.accessToken);
					await op('setProjectSaved', { projectId: all[j].projects[0]._id, saved: true }, a.accessToken);
				}
			}
			const target = all[i];
			let inquiry = await op(
				'createInquiry',
				{
					input: {
						creatorId: target.profile._id,
						serviceId: target.services[0]._id,
						subject: [
							'Identity for a neighborhood coffee shop',
							'Editorial design for an independent journal',
							'A planning app for small teams',
							'Visual direction for a guesthouse',
						][i],
						brief:
							'This is a fictional demo inquiry. We would like to discuss the creative direction, deliverables and a realistic timeline for our upcoming project.',
						budgetMin: 700000,
						budgetMax: 1800000,
					},
				},
				a.accessToken,
			);
			inquiry = await op(
				'submitInquiry',
				{ input: { inquiryId: inquiry._id, expectedVersion: inquiry.version } },
				a.accessToken,
			);
			await op(
				'sendInquiryMessage',
				{
					input: {
						inquiryId: inquiry._id,
						expectedVersion: inquiry.version,
						clientMessageKey: randomUUID(),
						body: 'Thanks for sharing your brief. I can prepare a proposed scope after we discuss the audience and launch date.',
					},
				},
				target.a.accessToken,
			);
		}
		fs.writeFileSync(
			path.join(root, 'docs/DEMO_ACCOUNTS.md'),
			'# Fictional demo accounts\n\nPreview only. All profiles, projects, clients and inquiries are fictional. Password for the accounts below: `' +
				password +
				'`. Use Email sign-in.\n\n' +
				accounts.map((a) => `- ${a.name} (${a.role}): ${a.email}`).join('\n') +
				'\n\nSeed targets only creatorhub_frontend_test. Artwork lives in the backend public/demo-media folder. Local fixture URLs are inserted directly into this disposable database; production upload validation is unchanged. The database is temporary and these records disappear when the disposable backend shuts down.\n',
		);
		console.log('Seeded 8 creators, 16 projects, 16 active services and 4 client accounts.');
	} finally {
		await mongo.close();
	}
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
