const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync(path.join(__dirname, '../libs/utils/messageKeyboard.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exported = {};
vm.runInNewContext(compiled, { exports: exported });

function press(overrides = {}, canSend = true) {
	let submitted = 0;
	let prevented = 0;
	exported.handleMessageKey(
		{
			key: 'Enter',
			shiftKey: false,
			repeat: false,
			keyCode: 13,
			nativeEvent: { isComposing: false },
			currentTarget: { form: { requestSubmit: () => submitted++ } },
			preventDefault: () => prevented++,
			...overrides,
		},
		canSend,
	);
	return { submitted, prevented };
}

test('Enter requests form submission once', () => assert.deepEqual(press(), { submitted: 1, prevented: 1 }));
test('Shift+Enter keeps native newline behavior', () =>
	assert.deepEqual(press({ shiftKey: true }), { submitted: 0, prevented: 0 }));
test('IME composition and its legacy Enter event do not submit', () => {
	assert.deepEqual(press({ nativeEvent: { isComposing: true } }), { submitted: 0, prevented: 0 });
	assert.deepEqual(press({ keyCode: 229 }), { submitted: 0, prevented: 0 });
});
test('Held Enter and unavailable sending do not submit', () => {
	assert.deepEqual(press({ repeat: true }), { submitted: 0, prevented: 1 });
	assert.deepEqual(press({}, false), { submitted: 0, prevented: 1 });
});
test('Other keys keep native behavior', () => assert.deepEqual(press({ key: 'a' }), { submitted: 0, prevented: 0 }));
