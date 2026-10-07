const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function harness() {
	const slots = [];
	let cursor = 0;
	let effects = [];
	const react = {
		useState(initial) {
			const index = cursor++;
			if (!(index in slots)) slots[index] = initial;
			return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
		},
		useRef(initial) {
			const index = cursor++;
			return slots[index] ||= { current: initial };
		},
		useEffect(effect, dependencies) {
			const index = cursor++;
			const previous = slots[index];
			if (!previous || dependencies.some((value, n) => value !== previous.dependencies[n])) {
				effects.push(() => {
					previous?.cleanup?.();
					slots[index] = { dependencies, cleanup: effect() };
				});
			}
		},
	};
	const context = { exports: {}, require: () => react };
	vm.runInNewContext(ts.transpileModule(fs.readFileSync('libs/hooks/usePageAdvance.ts', 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
	}).outputText, context);
	return (key, check, advance) => {
		cursor = 0;
		effects = [];
		const result = context.exports.usePageAdvance(key, check, advance);
		effects.forEach((effect) => effect());
		return result;
	};
}

test('an empty next page preserves current results and reports exhaustion', async () => {
	const render = harness();
	let advances = 0;
	const check = async () => false;
	const advance = () => advances++;
	assert.equal(await render('page-1', check, advance).next(), false);
	assert.equal(advances, 0);
	assert.equal(render('page-1', check, advance).noMoreResults, true);
	// A filter change clears the old last-page message.
	render('new-filter', check, advance);
	assert.equal(render('new-filter', check, advance).noMoreResults, false);
});

test('a populated next page advances only after the check and blocks repeated clicks', async () => {
	const render = harness();
	let finish, advances = 0, requests = 0;
	const check = () => { requests++; return new Promise((resolve) => { finish = resolve; }); };
	const advance = () => advances++;
	const page = render('page-1', check, advance);
	const pending = page.next();
	assert.equal(render('page-1', check, advance).checkingNext, true);
	assert.equal(advances, 0);
	assert.equal(await page.next(), false);
	assert.equal(requests, 1);
	finish(true);
	assert.equal(await pending, true);
	assert.equal(advances, 1);
	assert.equal(render('page-1', check, advance).checkingNext, false);
});

test('failed checks keep the page and allow a successful retry', async () => {
	const render = harness();
	let fails = true, advances = 0;
	const check = async () => { if (fails) throw new Error('offline'); return true; };
	const advance = () => advances++;
	assert.equal(await render('page-1', check, advance).next(), false);
	assert.equal(render('page-1', check, advance).nextPageError, true);
	assert.equal(advances, 0);
	fails = false;
	assert.equal(await render('page-1', check, advance).next(), true);
	assert.equal(advances, 1);
	assert.equal(render('page-1', check, advance).nextPageError, false);
});

test('a stale check cannot advance after filters change', async () => {
	const render = harness();
	let finish, advances = 0;
	const check = () => new Promise((resolve) => { finish = resolve; });
	const advance = () => advances++;
	const pending = render('old-filter', check, advance).next();
	render('new-filter', check, advance);
	finish(true);
	assert.equal(await pending, false);
	assert.equal(advances, 0);
});
