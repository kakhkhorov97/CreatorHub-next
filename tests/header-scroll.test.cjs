const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function controller(initialY = 0) {
	const context = { exports: {}, require: () => ({}) };
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('libs/hooks/useHeaderScroll.ts', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
		}).outputText,
		context,
	);
	return context.exports.createHeaderScrollController(initialY);
}

test('downward scrolling hides the header only after its height, upward scrolling reveals it', () => {
	const header = controller();
	assert.equal(header.update(120, 2000, 200), false);
	assert.equal(header.update(220, 2000, 200), true);
	assert.equal(header.update(215, 2000, 200), true);
	assert.equal(header.update(208, 2000, 200), false);
});

test('small direction changes cannot make a hidden header flicker', () => {
	const header = controller();
	assert.equal(header.update(400, 2000, 200), true);
	for (const y of [399, 400, 398, 402, 400, 397, 401]) {
		assert.equal(header.update(y, 2000, 200), true);
	}
	assert.equal(header.update(380, 2000, 200), false);
});

test('elastic scrolling beyond the document bottom cannot reveal a hidden header', () => {
	const header = controller();
	assert.equal(header.update(1000, 1000, 200), true);
	for (const y of [1020, 1050, 1020, 1000]) {
		assert.equal(header.update(y, 1000, 200), true);
	}
	assert.equal(header.update(988, 1000, 200), false);
});

test('the top of the page and negative elastic positions keep the header visible', () => {
	const header = controller();
	assert.equal(header.update(300, 1000, 200), true);
	for (const y of [24, 0, -20, 0, 5]) {
		assert.equal(header.update(y, 1000, 200), false);
	}
});

test('an open menu or focused header control keeps the header visible and resets travel', () => {
	const header = controller();
	assert.equal(header.update(300, 1000, 200), true);
	assert.equal(header.update(320, 1000, 200, true), false);
	assert.equal(header.update(335, 1000, 200), false);
	assert.equal(header.update(340, 1000, 200), true);
});

test('restored scroll positions start visible and ignore invalid samples', () => {
	const header = controller(500);
	assert.equal(header.update(500, 1000, 200), false);
	assert.equal(header.update(Number.NaN, 1000, 200), false);
	assert.equal(header.update(515, 1000, 200), false);
	assert.equal(header.update(516, 1000, 200), true);
});
