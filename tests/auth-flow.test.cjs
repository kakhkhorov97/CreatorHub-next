const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const jsx = require('react/jsx-runtime');
test('successful email signup opens confirmation, preserves return path and does not save a login session', async () => {
	const saved = new Map();
	const routes = [];
	let sessionSaved = false;
	const calls = [];
	const formValues = {
		displayName: 'Test User',
		email: ' test@example.invalid ',
		phoneNumber: '01012345678',
		password: 'River7!Cloud',
		confirmPassword: 'River7!Cloud',
	};
	const action = {
		error: '',
		busy: false,
		setError: () => {},
		run: async (fn) => fn(),
		mutate: async (name, args) => {
			calls.push({ name, args });
			return { accessToken: 'unsaved-test-token', user: { role: 'USER' } };
		},
		client: { clearStore: async () => {} },
	};
	const ctx = {
		exports: {},
		sessionStorage: {
			setItem: (k, v) => saved.set(k, v),
			getItem: (k) => saved.get(k),
			removeItem: (k) => saved.delete(k),
		},
		require: (name) => {
			if (name === 'react') return { ...React, useEffect: () => {}, useState: (initial) => [initial, () => {}] };
			if (name === 'react/jsx-runtime') return jsx;
			if (name === 'next-i18next') return { useTranslation: () => ({ t: (k) => k }) };
			if (name === 'next/link') return { default: () => null };
			if (name === 'next/router')
				return {
					useRouter: () => ({
						query: { returnTo: '/creators/test?inquiry=1' },
						locale: 'en',
						push: async (p) => routes.push(p),
					}),
				};
			if (name === '../../auth')
				return {
					safeReturnTo: (p) => p,
					saveSession: () => {
						sessionSaved = true;
					},
				};
			if (name === '../../hooks/useApi') return { useAction: () => action };
			if (name === '../../utils/authForm') return { validateAuthForm: () => ({}) };
			if (name === '../common/UI')
				return {
					values: () => ({ ...formValues }),
					Field: () => null,
					Password: () => null,
					Button: () => null,
					Notice: () => null,
				};
			throw Error('Unexpected import ' + name);
		},
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('libs/components/account/Auth.tsx', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
		}).outputText,
		ctx,
	);
	const tree = ctx.exports.default({ mode: 'register' });
	const findForm = (node) => {
		if (!node || typeof node !== 'object') return;
		if (node.type === 'form') return node;
		for (const child of React.Children.toArray(node.props?.children)) {
			const found = findForm(child);
			if (found) return found;
		}
	};
	findForm(tree).props.onSubmit({ preventDefault: () => {}, currentTarget: {} });
	await new Promise((resolve) => setImmediate(resolve));
	assert.deepEqual(routes, ['/account/check-email?returnTo=%2Fcreators%2Ftest%3Finquiry%3D1']);
	assert.equal(saved.get('creatorhub.pendingEmail'), 'test@example.invalid');
	assert.equal(sessionSaved, false);
	assert.equal(calls[0].name, 'register');
	assert.equal(calls[0].args.input.phoneNumber, '+821012345678');
});
