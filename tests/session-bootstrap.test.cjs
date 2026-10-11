const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

for (const invalid of [false, true]) {
	test(`startup ${
		invalid ? 'authentication rejection clears' : 'temporary failure preserves'
	} saved credentials`, async () => {
		let cleared = false;
		let ready = false;
		const session = { refreshToken: 'saved-refresh' };
		const effects = [];
		const error = invalid ? { graphQLErrors: [{ extensions: { code: 'UNAUTHENTICATED' } }] } : new Error('Offline');
		const context = {
			exports: {},
			require(name) {
				if (name === 'react') return { useEffect: (effect) => effects.push(effect) };
				if (name === '@apollo/client')
					return {
						useApolloClient: () => ({
							query: async () => {
								throw error;
							},
						}),
					};
				if (name === '../../auth')
					return {
						readSession: () => session,
						clearSession: () => {
							cleared = true;
						},
						finishSessionCheck: () => {
							ready = true;
						},
						isAuthenticationError: (failure) => failure.graphQLErrors?.[0]?.extensions?.code === 'UNAUTHENTICATED',
					};
				if (name === '../../hooks/useApi') return { documents: { me: {} } };
				return {};
			},
		};
		vm.runInNewContext(
			ts.transpileModule(fs.readFileSync('libs/components/layout/LayoutBasic.tsx', 'utf8'), {
				compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
			}).outputText,
			context,
		);
		context.exports.SessionBootstrap();
		effects[0]();
		await new Promise((resolve) => setImmediate(resolve));
		assert.equal(cleared, invalid);
		assert.equal(ready, true);
	});
}
