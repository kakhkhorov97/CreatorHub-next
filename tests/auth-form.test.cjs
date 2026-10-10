const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
class Input {
	constructor(name, value, validity = {}) {
		Object.assign(this, { name, value, validity, disabled: false, type: 'text', minLength: -1, maxLength: -1 });
	}
}
const context = {
	exports: {},
	HTMLInputElement: Input,
	FormData: class {
		constructor(form) {
			this.form = form;
		}
		get(name) {
			return this.form.elements.find((i) => i.name === name)?.value;
		}
	},
};
vm.runInNewContext(
	ts.transpileModule(fs.readFileSync('libs/utils/authForm.ts', 'utf8'), {
		compilerOptions: { module: ts.ModuleKind.CommonJS },
	}).outputText,
	context,
);
const { authSubmissionErrorField, validateAuthForm } = context.exports;
test('auth errors target credentials and verification fields without revealing which login credential failed', () => {
	assert.equal(authSubmissionErrorField('Invalid login or password', 'sign-in'), 'password');
	assert.equal(authSubmissionErrorField('That login method already belongs to an account', 'register'), 'email');
	assert.equal(authSubmissionErrorField('displayName must be longer', 'register'), 'displayName');
	assert.equal(authSubmissionErrorField('phoneNumber must be valid', 'register'), 'phoneNumber');
	assert.equal(authSubmissionErrorField('Invalid or expired token', 'verify-email'), 'token');
	assert.equal(authSubmissionErrorField('Service unavailable', 'verify-email', true), 'email');
});
test('required fields, malformed email and password mismatch remain attached to their own inputs', () => {
	const email = new Input('email', 'invalid', { typeMismatch: true });
	email.type = 'email';
	const form = {
		elements: [
			new Input('displayName', '', { valueMissing: true }),
			email,
			new Input('password', 'River7!Cloud'),
			new Input('confirmPassword', 'Other8!Cloud'),
		],
	};
	const errors = validateAuthForm(form, true);
	assert.equal(errors.displayName, 'This field is required.');
	assert.equal(errors.email, 'Enter a valid email address.');
	assert.equal(errors.confirmPassword, 'Passwords do not match. Please try again.');
	assert.equal(form.elements[2].value, 'River7!Cloud');
});
test('matching valid passwords pass and optional disabled inputs do not block submission', () => {
	const disabled = new Input('email', '', { valueMissing: true });
	disabled.disabled = true;
	assert.equal(
		Object.keys(
			validateAuthForm(
				{ elements: [disabled, new Input('password', 'River7!Cloud'), new Input('confirmPassword', 'River7!Cloud')] },
				true,
			),
		).length,
		0,
	);
});
