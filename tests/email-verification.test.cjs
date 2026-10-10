const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const jsx = require('react/jsx-runtime');
function harness(token, result = true) {
	const states = [];
	const effects = [];
	const calls = [];
	const storage = new Map([['creatorhub.pendingEmail', 'reader@example.invalid']]);
	let index = 0;
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
			if (result instanceof Error) throw result;
			return result;
		},
		setError: () => {},
	};
	const context = {
		exports: {},
		sessionStorage: {
			getItem: (k) => storage.get(k),
			removeItem: (k) => storage.delete(k),
			setItem: (k, v) => storage.set(k, v),
		},
		require: (name) => {
			if (name === 'react')
				return {
					...React,
					useState: (initial) => {
						const i = index++;
						if (!(i in states)) states[i] = initial;
						return [
							states[i],
							(value) => {
								states[i] = value;
							},
						];
					},
					useRef: (initial) => {
						const i = index++;
						if (!(i in states)) states[i] = { current: initial };
						return states[i];
					},
					useEffect: (fn) => effects.push(fn),
				};
			if (name === 'react/jsx-runtime') return jsx;
			if (name === 'next-i18next') return { useTranslation: () => ({ t: (k) => k }) };
			if (name === 'next/router')
				return { useRouter: () => ({ isReady: true, query: { token, returnTo: '/creators' } }) };
			if (name === 'next/link') return { default: () => null };
			if (name === 'phosphor-react') return { EnvelopeSimple: () => null, CheckCircle: () => null };
			if (name === '../../auth') return { safeReturnTo: (p) => p };
			if (name === '../../hooks/useApi') return { useAction: () => action };
			if (name === '../../utils/authForm') return {};
			if (name === '../common/UI') return { Field: () => null, Button: () => null, LinkButton: () => null };
			throw Error('Unexpected import ' + name);
		},
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('libs/components/account/EmailConfirmation.tsx', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
		}).outputText,
		context,
	);
	return {
		calls,
		storage,
		effects,
		render: () => {
			index = 0;
			effects.length = 0;
			return context.exports.default({ verifyLink: true });
		},
	};
}
function text(node) {
	if (typeof node === 'string') return node;
	if (!node || typeof node !== 'object') return '';
	return React.Children.toArray(node.props?.children).map(text).join(' ');
}
test('email link verifies automatically once across repeated effects and shows success', async () => {
	const h = harness('a'.repeat(64));
	h.render();
	const effects = [...h.effects];
	effects.forEach((fn) => fn());
	effects.forEach((fn) => fn());
	await new Promise((resolve) => setImmediate(resolve));
	assert.equal(h.calls.length, 1);
	assert.equal(h.calls[0].name, 'verifyEmail');
	assert.equal(h.calls[0].args.token, 'a'.repeat(64));
	assert.equal(h.storage.has('creatorhub.pendingEmail'), false);
	const rendered = text(h.render());
	assert.match(rendered, /Email verified/);
	assert.match(rendered, /Your account is verified/);
	assert.doesNotMatch(rendered, /Verification token/);
});
test('malformed verification links never reach the API and offer recovery', () => {
	const h = harness('bad');
	h.render();
	h.effects.forEach((fn) => fn());
	assert.equal(h.calls.length, 0);
	assert.match(text(h.render()), /invalid or has expired/);
	assert.match(text(h.render()), /Resend email/);
});
test('expired and failed verification requests never show success', async () => {
	const h = harness('b'.repeat(64), new Error('Invalid or expired token'));
	h.render();
	h.effects.forEach((fn) => fn());
	await new Promise((resolve) => setImmediate(resolve));
	assert.match(text(h.render()), /invalid or has expired/);
	assert.equal(h.storage.has('creatorhub.pendingEmail'), true);
});
