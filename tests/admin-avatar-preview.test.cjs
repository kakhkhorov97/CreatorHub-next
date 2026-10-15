const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const jsx = require('react/jsx-runtime');

function harness(avatarUrl) {
	const entry = {
		_id: 'fixture-user',
		status: 'ACTIVE',
		user: { displayName: 'Test member', avatarUrl, role: 'USER', preferredLocale: 'en' },
	};
	const calls = [];
	const Picture = () => null;
	const Field = () => null;
	const action = {
		busy: false,
		run: async (fn) => fn(),
		mutate: async (name, args) => {
			calls.push({ name, args });
		},
		client: { query: async () => ({ data: { adminDirectory: { list: [entry] } } }) },
	};
	const api = {
		useApi: () => ({ value: [], loading: false }),
		useAction: () => action,
		documents: { adminDirectory: {} },
	};
	const context = {
		exports: {},
		FormData: class {
			getAll() {
				return [];
			}
		},
		require(name) {
			if (name === 'react') return { ...React, useState: (value) => [value, () => {}] };
			if (name === 'react/jsx-runtime') return jsx;
			if (name === 'next-i18next') return { useTranslation: () => ({ t: (key) => key }) };
			if (name === 'next/link') return () => null;
			if (name === '../../hooks/useApi') return api;
			if (name === '../../hooks/useFormValidation')
				return {
					FieldErrors: ({ children }) => children,
					useFormValidation: () => ({ errors: {}, validate: () => true, clear() {}, form: {} }),
				};
			if (name === './directoryConfig') return { labels: { USERS: 'Users' }, states: { USERS: ['ACTIVE'] } };
			if (name === '../common/UI')
				return new Proxy(
					{ Picture, Field, values: (form) => form.fields, optional: (value) => value || undefined },
					{ get: (target, key) => target[key] || (() => null) },
				);
			throw new Error(name);
		},
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('libs/components/admin/RecordEditor.tsx', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
		}).outputText,
		context,
	);
	const tree = context.exports.Editor({ kind: 'USERS', entry, onClose() {} });
	const nodes = (node) =>
		!node || typeof node !== 'object' ? [] : [node, ...React.Children.toArray(node.props?.children).flatMap(nodes)];
	return { nodes: nodes(tree), calls, Picture, Field };
}

test('admin user details show an avatar preview or an empty message without a URL input', () => {
	for (const avatar of [undefined, '/uploads/fixture-user/avatar.jpg']) {
		const h = harness(avatar);
		assert.equal(h.nodes.find((node) => node.type === h.Picture).props.src, avatar);
		assert.equal(
			h.nodes.some((node) => node.type === h.Field && node.props.name === 'avatarUrl'),
			false,
		);
		assert.equal(
			h.nodes.some((node) => node.type === 'p' && node.props.children === 'No profile photo'),
			!avatar,
		);
	}
});

test('saving admin user details leaves the existing avatar untouched', async () => {
	const h = harness('/uploads/fixture-user/avatar.jpg');
	await h.nodes
		.find((node) => node.type === 'form')
		.props.onSubmit({
			preventDefault() {},
			currentTarget: { fields: { displayName: 'Updated member', role: 'USER', preferredLocale: 'en' } },
		});
	assert.equal(h.calls[0].name, 'adminUpdateUser');
	assert.equal(Object.hasOwn(h.calls[0].args.input, 'avatarUrl'), false);
	assert.equal(h.calls[0].args.input.displayName, 'Updated member');
});
