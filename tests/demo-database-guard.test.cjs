const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

test('demo styling rejects remote and production databases before connecting', () => {
	const source = fs.readFileSync('scripts/style-demo.cjs', 'utf8');
	for (const uri of [
		'mongodb://127.0.0.1/creatorhub_prod',
		'mongodb://db.example/creatorhub_frontend_test',
		'mongodb+srv://db.example/creatorhub_frontend_test',
	]) {
		let connections = 0;
		const context = {
			__dirname: path.resolve('scripts'),
			URL,
			require(name) {
				if (name === 'fs') return { readFileSync: () => JSON.stringify({ uri }) };
				if (name === 'path') return path;
				if (name === './backend-path.cjs')
					return {
						backendRequire: () => ({
							MongoClient: {
								connect: () => {
									connections++;
								},
							},
						}),
					};
				throw new Error('Unexpected dependency');
			},
		};
		assert.throws(() => vm.runInNewContext(source, context), /local disposable preview/);
		assert.equal(connections, 0);
	}
});
