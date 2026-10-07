const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const vm = require('vm');
const ts = require('typescript');
function harness() {
	const timers = new Map();
	let next = 0;
	const ctx = {
		exports: {},
		setTimeout: (fn) => {
			const id = ++next;
			timers.set(id, fn);
			return id;
		},
		clearTimeout: (id) => timers.delete(id),
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync('libs/messaging/refreshScheduler.ts', 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
		}).outputText,
		ctx,
	);
	const tick = async () => {
		const callbacks = [...timers.values()];
		timers.clear();
		await Promise.all(callbacks.map((fn) => fn()));
	};
	return { create: ctx.exports.createRefreshScheduler, timers, tick };
}
test('bursts refresh once and disposed timers make no requests', async () => {
	const { create, timers, tick } = harness();
	let calls = 0;
	const queue = create(() => calls++);
	for (let n = 0; n < 30; n++) queue.schedule();
	assert.equal(timers.size, 1);
	await tick();
	assert.equal(calls, 1);
	queue.schedule();
	queue.dispose();
	await tick();
	queue.schedule();
	assert.equal(calls, 1);
	assert.equal(timers.size, 0);
});
test('invalidations during an active refresh cause one follow-up without overlapping requests', async () => {
	const { create, timers, tick } = harness();
	let calls = 0,
		finish;
	const queue = create(() => {
		calls++;
		return new Promise((resolve) => (finish = resolve));
	});
	queue.schedule();
	const first = tick();
	for (let n = 0; n < 30; n++) queue.schedule();
	assert.equal(calls, 1);
	assert.equal(timers.size, 0);
	finish();
	await first;
	assert.equal(timers.size, 1);
	const second = tick();
	assert.equal(calls, 2);
	finish();
	await second;
	assert.equal(timers.size, 0);
});
test('a failed refresh does not stop later updates', async () => {
	const { create, tick } = harness();
	let calls = 0;
	const queue = create(() => {
		if (++calls === 1) throw new Error('Offline');
	});
	queue.schedule();
	await tick();
	queue.schedule();
	await tick();
	assert.equal(calls, 2);
});
