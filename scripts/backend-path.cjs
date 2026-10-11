const path = require('node:path');
const { createRequire } = require('node:module');

const backendPath = path.resolve(
	process.env.CREATORHUB_BACKEND_PATH || path.join(__dirname, '../../creatorhub-backend-starter'),
);
const backendRequire = createRequire(path.join(backendPath, 'package.json'));

module.exports = { backendPath, backendRequire };
