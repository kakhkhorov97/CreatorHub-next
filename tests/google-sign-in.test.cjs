const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const jsx = require('react/jsx-runtime');
function harness(result) {
	const slots = [],
		effects = [],
		calls = [],
		routes = [],
		saved = [],
		setups = [];
	let index = 0,
		configuration;
	function Script() {
		return null;
	}
	const session = {
		accessToken: 'fixture-access',
		refreshToken: 'fixture-refresh',
		expiresIn: 900,
		user: { role: 'USER' },
	};
	const action = {
		busy: false,
		error: '',
		run: async (fn) => {
			try {
				return await fn();
			} catch (e) {
				action.error = e.message;
			}
		},
		mutate: async (name, args) => {
			calls.push({ name, args });
			if (name === 'beginSocialLogin') return 'a'.repeat(64);
			if (name === 'loginGoogle') {
				if (result instanceof Error) throw result;
				return result;
			}
			if (name === 'completeGoogleSignup') return session;
		},
		client: { clearStore: async () => {} },
	};
	const context = {
		exports: {},
		Error,
		process: { env: { NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'fixture.apps.googleusercontent.com' } },
		window: {
			google: {
				accounts: {
					id: {
						initialize: (c) => {
							configuration = c;
						},
						renderButton: () => {},
					},
				},
			},
		},
		sessionStorage: { getItem: () => '/creators/test?inquiry=1', removeItem: () => {} },
		require: (name) => {
			if (name === 'react')
				return {
					...React,
					useState: (initial) => {
						const i = index++;
						if (!(i in slots)) slots[i] = initial;
						return [slots[i], (v) => (slots[i] = v)];
					},
					useRef: (initial) => {
						const i = index++;
						if (!(i in slots))
							slots[i] = { current: initial === null ? { clientWidth: 320, replaceChildren() {} } : initial };
						return slots[i];
					},
					useEffect: (fn, deps) => {
						const i = index++;
						if (!slots[i] || deps.some((d, j) => d !== slots[i][j])) effects.push(fn);
						slots[i] = deps;
					},
				};
			if (name === 'react/jsx-runtime') return jsx;
			if (name === 'next/script') return Script;
			if (name === 'next/router')
				return {
					useRouter: () => ({
						query: { returnTo: '/creators/test?inquiry=1' },
						locale: 'en',
						push: async (path) => routes.push(path),
					}),
				};
			if (name === 'next-i18next') return { useTranslation: () => ({ t: (k) => k }) };
			if (name === '../../auth')
				return { safeReturnTo: (p) => p, authenticationDestination: (p) => p, saveSession: (s) => saved.push(s) };
			if (name === '../../hooks/useApi') return { useAction: () => action };
			if (name === '../../utils/authForm') return { validateAuthForm: () => ({}) };
			if (name === '../common/UI') return { Button: () => null, Field: () => null, values: (f) => f.fields };
			throw Error(name);
		},
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('libs/components/account/GoogleSignIn.tsx', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
		}).outputText,
		context,
	);
	const nodes = (n) =>
		!n || typeof n !== 'object' ? [] : [n, ...React.Children.toArray(n.props?.children).flatMap(nodes)];
	const render = () => {
		index = 0;
		effects.length = 0;
		return context.exports.default({ onSetupChange: (v) => setups.push(v) });
	};
	return {
		calls,
		routes,
		saved,
		setups,
		session,
		nodes,
		render,
		action,
		effects,
		async ready() {
			render();
			effects.forEach((f) => f());
			await new Promise((r) => setImmediate(r));
			const tree = render();
			nodes(tree)
				.find((n) => n.type === Script)
				.props.onReady();
			render();
			effects.forEach((f) => f());
		},
		async credential() {
			configuration.callback({ credential: 'verified-provider-fixture' });
			await new Promise((r) => setImmediate(r));
		},
		configuration: () => configuration,
	};
}
test('returning Google users save the issued session and resume the protected page', async () => {
	const h = harness({ session: { accessToken: 'fixture-access', user: { role: 'USER' } } });
	await h.ready();
	assert.equal(h.configuration().nonce, 'a'.repeat(64));
	await h.credential();
	assert.equal(h.calls[1].name, 'loginGoogle');
	assert.equal(h.calls[1].args.input.idToken, 'verified-provider-fixture');
	assert.equal(h.saved.length, 1);
	assert.deepEqual(h.routes, ['/creators/test?inquiry=1']);
	assert.deepEqual(h.setups, []);
});
test('new Google users finish the contact form without reauthenticating or setting a password', async () => {
	const h = harness({ signupToken: 'b'.repeat(64), displayName: 'Google Member' });
	await h.ready();
	await h.credential();
	assert.equal(h.saved.length, 0);
	assert.deepEqual(h.setups, [true]);
	const tree = h.render(),
		form = h.nodes(tree).find((n) => n.type === 'form');
	await form.props.onSubmit({
		preventDefault() {},
		currentTarget: { fields: { displayName: 'Google Member', phoneNumber: '010 2345 6789' } },
	});
	const completion = h.calls.find((c) => c.name === 'completeGoogleSignup');
	assert.equal(completion.args.input.phoneNumber, '+821023456789');
	assert.equal(completion.args.input.signupToken, 'b'.repeat(64));
	assert.equal('password' in completion.args.input, false);
	assert.equal(h.calls.filter((c) => c.name === 'loginGoogle').length, 1);
	assert.equal(h.saved.length, 1);
	assert.equal(h.routes.length, 1);
});
test('unverified Google responses do not create a local session and allow a fresh challenge', async () => {
	const h = harness(new Error('Social sign-in could not be verified'));
	await h.ready();
	await h.credential();
	assert.equal(h.saved.length, 0);
	assert.equal(h.routes.length, 0);
	assert.match(h.action.error, /could not be verified/);
	const retry = h.nodes(h.render()).find((n) => n.props.children === 'Try again');
	assert.ok(retry);
	retry.props.onClick();
	await new Promise((r) => setImmediate(r));
	assert.equal(h.calls.filter((c) => c.name === 'beginSocialLogin').length, 2);
});
