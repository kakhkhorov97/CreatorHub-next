const fs = require('fs');
const { MongoClient } = require('/Users/kakhkhorov/Desktop/creatorhub-backend-starter/node_modules/mongodb');
const root = require('path').resolve(__dirname, '..');
(async () => {
	const c = await MongoClient.connect(JSON.parse(fs.readFileSync(root + '/.preview-db.json')).uri);
	const db = c.db('creatorhub_frontend_test');
	const samples = [
		[
			'mina-park-0',
			'morrow-cafe',
			'Morrow Cafe — Brand identity',
			'A warm identity for a fictional neighborhood cafe.',
		],
		[
			'joon-lee-0',
			'kinder-tomorrow',
			'A Kinder Tomorrow — Editorial design',
			'A print study in thoughtful typography and tactile paper.',
		],
		[
			'sora-kim-0',
			'blank-wellness',
			'Blank — Wellness website',
			'A calm digital experience for a fictional wellness studio.',
		],
	];
	for (let i = 0; i < samples.length; i++) {
		const [slug, file, title, summary] = samples[i];
		const url = '/demo-media/' + file + '.png';
		await db.collection('portfolioProjects').updateOne(
			{ slug },
			{
				$set: {
					title,
					summary,
					coverImageUrl: url,
					media: [{ type: 'IMAGE', url, altText: title, sortOrder: 0 }],
					publishedAt: new Date(Date.now() - i * 1000),
				},
			},
		);
		const profileSlug = slug.slice(0, -2);
		await db
			.collection('creatorProfiles')
			.updateOne({ slug: profileSlug }, { $set: { publishedAt: new Date(Date.now() - i * 1000) } });
	}
	const mina = await db.collection('creatorProfiles').findOne({ slug: 'mina-park' });
	if (mina) {
		await db
			.collection('users')
			.updateOne({ _id: mina.userId }, { $set: { avatarUrl: '/demo-media/mina-portrait.png' } });
		await db.collection('portfolioProjects').updateOne(
			{ slug: 'mina-park-1' },
			{
				$set: {
					title: 'A Kinder Tomorrow — Print study',
					coverImageUrl: '/demo-media/kinder-tomorrow.png',
					'media.0.url': '/demo-media/kinder-tomorrow.png',
				},
			},
		);
	}
	console.log('Demo portfolio artwork applied.');
	await c.close();
})().catch((e) => {
	console.error(e);
	process.exitCode = 1;
});
