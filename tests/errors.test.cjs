const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

const source = ts.transpileModule(fs.readFileSync('libs/utils/errors.ts', 'utf8'), {
	compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const { readableError } = (() => {
	const module = { exports: {} };
	new Function('module', 'exports', source)(module, module.exports);
	return module.exports;
})();

test('validation failures show the field reason, never the exception name', () => {
	const failure = {
		message: 'Bad Request Exception',
		graphQLErrors: [
			{
				message: 'Bad Request Exception',
				extensions: {
					originalError: {
						message: ['Enter a valid phone number with its country code, for example +82 10 1234 5678.'],
					},
				},
			},
		],
	};
	assert.equal(
		readableError(failure),
		'Enter a valid phone number with its country code, for example +82 10 1234 5678.',
	);
	assert.equal(
		readableError({ message: 'Bad Request Exception', graphQLErrors: [{ message: 'Bad Request Exception' }] }),
		'Check the highlighted fields and try again.',
	);
});

test('rate limits and network failures get plain explanations', () => {
	assert.equal(
		readableError({
			message: 'Too many requests. Try again shortly.',
			graphQLErrors: [{ message: 'Too many requests. Try again shortly.' }],
		}),
		'Too many attempts. Please wait a minute and try again.',
	);
	assert.equal(
		readableError({ message: 'Failed to fetch', networkError: { message: 'Failed to fetch' } }),
		'We could not reach CreatorHub. Check your connection and try again.',
	);
});

test('ordinary server messages pass through unchanged', () => {
	assert.equal(
		readableError({
			message: 'Invalid or expired token',
			graphQLErrors: [
				{ message: 'Invalid or expired token', extensions: { originalError: { message: 'Invalid or expired token' } } },
			],
		}),
		'Invalid or expired token',
	);
	assert.equal(
		readableError(new Error('Telegram sign-in was not completed. Please try again.')),
		'Telegram sign-in was not completed. Please try again.',
	);
});
