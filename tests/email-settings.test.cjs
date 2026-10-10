const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const jsx = require('react/jsx-runtime');
const server = require('react-dom/server');
function harness(failure) {
	const states = [],
		calls = [];
	let cursor = 0;
	const api = {
		value: [
			{ _id: 'fixture-email', provider: 'EMAIL', providerSubject: 'current@example.invalid', verifiedAt: '2026-10-10' },
		],
		loading: false,
	};
	const action = {
		busy: false,
		error: '',
		setError: () => {},
		run: async (fn) => fn(),
		mutate: async (name, args) => {
			calls.push({ name, args });
			if (failure) throw Error(failure);
			return true;
		},
	};
	const Button = (props) => React.createElement('button', props, props.children);
	const Field = (props) =>
		React.createElement(
			'label',
			null,
			props.label,
			React.createElement('input', { name: props.name, type: props.type, required: props.required }),
			props.error && React.createElement('small', { role: 'alert' }, props.error),
		);
	const context = {
		Error,
		exports: {},
		require: (name) => {
			if (name === 'react')
				return {
					...React,
					useState: (initial) => {
						const i = cursor++;
						if (!(i in states)) states[i] = initial;
						return [
							states[i],
							(v) => {
								states[i] = v;
							},
						];
					},
				};
			if (name === 'react/jsx-runtime') return jsx;
			if (name === 'next-i18next')
				return {
					useTranslation: () => ({ t: (key, params) => (params ? key.replace('{{email}}', params.email) : key) }),
				};
			if (name === '../../hooks/useApi') return { useApi: () => api, useAction: () => action };
			if (name === '../../utils/authForm') return { validateAuthForm: () => ({}) };
			if (name === '../common/UI')
				return { Button, Field, Password: Field, QueryState: () => null, values: (form) => form.fields };
			throw Error(name);
		},
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('libs/components/account/ChangeEmailSettings.tsx', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
		}).outputText,
		context,
	);
	const render = () => {
		cursor = 0;
		return context.exports.default();
	};
	const nodes = (node) =>
		!node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(nodes)];
	const html = () => server.renderToStaticMarkup(render());
	return { render, nodes, calls, html, api };
}
test('change email sends confirmation without replacing the current address or creating another identity', async () => {
	const h = harness();
	assert.doesNotMatch(h.html(), /Remove|Add a sign-in method|Link email|Continue with Google/);
	h.nodes(h.render())
		.find((n) => n.props.children === 'Change email')
		.props.onClick();
	const form = h.nodes(h.render()).find((n) => n.type === 'form');
	let reset = false;
	await form.props.onSubmit({
		preventDefault() {},
		currentTarget: {
			fields: { email: 'next@example.invalid', currentPassword: 'Existing-password-123' },
			reset() {
				reset = true;
			},
		},
	});
	assert.equal(reset, true);
	assert.equal(h.calls[0].name, 'requestEmailChange');
	assert.equal(h.api.value[0].providerSubject, 'current@example.invalid');
	assert.match(h.html(), /current@example.invalid/);
	assert.match(h.html(), /Confirmation sent to next@example.invalid/);
});
test('incorrect current password stays inline and does not show email change success', async () => {
	const h = harness('Current password is incorrect');
	h.nodes(h.render())
		.find((n) => n.props.children === 'Change email')
		.props.onClick();
	await h
		.nodes(h.render())
		.find((n) => n.type === 'form')
		.props.onSubmit({
			preventDefault() {},
			currentTarget: {
				fields: { email: 'next@example.invalid', currentPassword: 'wrong' },
				reset() {
					throw Error('must not reset');
				},
			},
		});
	assert.match(h.html(), /role="alert">Current password is incorrect/);
	assert.doesNotMatch(h.html(), /Confirmation sent/);
});
