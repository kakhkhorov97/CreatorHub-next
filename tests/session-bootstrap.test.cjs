const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

// The saved account must reach the header before `me` is even requested, otherwise the
// header shows Sign in / Sign up for the length of that round trip.
test('the saved account is published before the session check queries me', async () => {
	const order = [];
	const effects = [];
	const context = {
		exports: {},
		require(name) {
			if (name === 'react') return { useEffect: (effect) => effects.push(effect) };
			if (name === '@apollo/client')
				return {
					useApolloClient: () => ({
						query: async () => {
							order.push('me');
							return { data: { me: { _id: 'saved-user' } } };
						},
					}),
				};
			if (name === '../../auth')
				return {
					readSession: () => ({ refreshToken: 'saved-refresh', sessionId: 'saved-session' }),
					watchSharedSession: () => () => {},
					clearSession: () => {},
					finishSessionCheck: () => order.push('ready'),
					publishSessionHint: () => order.push('hint'),
					isAuthenticationError: () => false,
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
	// Both before any await resolves: the identity needs no network round trip.
	assert.deepEqual(order, ['hint', 'me']);
	await new Promise((resolve) => setImmediate(resolve));
	assert.deepEqual(order, ['hint', 'me', 'ready']);
});

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
						watchSharedSession: () => () => {},
						clearSession: () => {
							cleared = true;
						},
						finishSessionCheck: () => {
							ready = true;
						},
						publishSessionHint: () => {},
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
