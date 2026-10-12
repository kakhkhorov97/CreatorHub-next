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

test('mobile header switches to compact controls after scrolling and restores at the top', () => {
	const header = controller();
	assert.equal(header.update(80, 2000), false);
	assert.equal(header.update(81, 2000), true);
	assert.equal(header.update(40, 2000), true);
	assert.equal(header.update(24, 2000), false);
});
test('small movements around the threshold do not flicker the controls', () => {
	const header = controller();
	assert.equal(header.update(100, 2000), true);
	for (const y of [79, 80, 78, 82, 40, 25]) assert.equal(header.update(y, 2000), true);
	assert.equal(header.update(24, 2000), false);
});
test('elastic overscroll and invalid positions do not change compact controls', () => {
	const header = controller();
	assert.equal(header.update(1000, 1000), true);
	for (const y of [1020, 1050, Number.NaN]) assert.equal(header.update(y, 1000), true);
	assert.equal(header.update(-20, 1000), false);
});
test('open menus and focused controls keep the current controls mounted', () => {
	const header = controller();
	assert.equal(header.update(100, 1000, true), false);
	assert.equal(header.update(100, 1000), true);
	assert.equal(header.update(0, 1000, true), true);
	assert.equal(header.update(0, 1000), false);
});
test('restored scroll positions start with compact controls', () => {
	const header = controller(500);
	assert.equal(header.update(500, 1000), true);
	assert.equal(header.update(0, 1000), false);
});
