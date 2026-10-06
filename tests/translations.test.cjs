const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../next-i18next.config');
const resources = Object.fromEntries(['en', 'ko', 'uz'].map((locale) => [locale, require(`../public/locales/${locale}/common.json`)]));

test('all three language catalogs have matching keys and interpolation variables', () => {
	const keys = Object.keys(resources.en).sort();
	for (const locale of ['ko', 'uz']) {
		assert.deepEqual(Object.keys(resources[locale]).sort(), keys);
		for (const key of keys) {
			const variables = (value) => (value.match(/{{[^}]+}}/g) || []).sort();
			assert.deepEqual(variables(resources[locale][key]), variables(resources.en[key]), `${locale}: ${key}`);
		}
	}
	assert.deepEqual(config.i18n.locales, ['en', 'ko', 'uz']);
});

test('every explicit UI translation exists in every language, with no fallback-only keys', () => {
	const parser = require('@babel/parser');
	const traverse = require('@babel/traverse').default;
	function check(directory) {
		for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
			const file = path.join(directory, item.name);
			if (item.isDirectory()) { check(file); continue; }
			if (!file.endsWith('.tsx')) continue;
			const ast = parser.parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['typescript', 'jsx'] });
			traverse(ast, { CallExpression(p) {
				if (!['translate', 't'].includes(p.node.callee.name) || p.node.arguments[0]?.type !== 'StringLiteral') return;
				const key = p.node.arguments[0].value;
				for (const locale of ['en', 'ko', 'uz']) assert.ok(Object.hasOwn(resources[locale], key), `${file}: ${locale}: ${key}`);
			} });
		}
	}
	check(path.join(__dirname, '../pages'));
	check(path.join(__dirname, '../libs/components'));
});
