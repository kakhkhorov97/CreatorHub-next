const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const jsx = require('react/jsx-runtime');

function harness(file, result, query = {}, attempt) {
	const slots = [],
		effects = [],
		calls = [],
		routes = [],
		saved = [],
		setups = [],
		redirects = [],
		replaced = [];
	const storage = new Map();
	if (attempt !== undefined)
		storage.set('creatorhub.kakaoAttempt', typeof attempt === 'string' ? attempt : JSON.stringify(attempt));
	let index = 0,
		callback;
	function Script() {
		return null;
	}
	function Signup() {
		return null;
	}
	const action = {
		busy: false,
		error: '',
		client: { clearStore: async () => {} },
		run: async (fn) => {
			try {
				return await fn();
			} catch (e) {
				action.error = e.message;
			}
		},
		mutate: async (name, args) => {
			calls.push({ name, args });
			if (name === 'beginSocialLogin') return 'a'.repeat(64);
			if (name === 'beginKakaoLogin')
				return { state: 'b'.repeat(64), authorizationUrl: 'https://kauth.kakao.com/oauth/authorize?fixture=1' };
			if (result instanceof Error) throw result;
			return result;
		},
	};
	const router = {
		isReady: true,
		query,
		locale: 'en',
		push: async (p) => routes.push(p),
		replace: async (p) => replaced.push(p),
	};
	const ctx = {
		exports: {},
		Error,
		Date,
		process: { env: { NEXT_PUBLIC_TELEGRAM_CLIENT_ID: '12345' } },
		sessionStorage: {
			getItem: (k) => storage.get(k) || null,
			setItem: (k, v) => storage.set(k, v),
			removeItem: (k) => storage.delete(k),
		},
		window: {
			Telegram: {
				Login: {
					auth: (options, cb) => {
						callback = cb;
						calls.push({ name: 'sdk', args: options });
					},
				},
			},
			location: { assign: (url) => redirects.push(url) },
		},
		require: (name) => {
			if (name === 'react')
				return {
					...React,
					useState: (initial) => {
						const i = index++;
						if (!(i in slots)) slots[i] = initial;
						return [slots[i], (v) => (slots[i] = v)];
					},
					useRef: (initial) => {
						const i = index++;
						if (!(i in slots)) slots[i] = { current: initial };
						return slots[i];
					},
					useEffect: (fn, deps) => {
						const i = index++;
						if (!slots[i] || deps.some((d, j) => d !== slots[i][j])) effects.push(fn);
						slots[i] = deps;
					},
				};
			if (name === 'react-icons/si') return { SiKakaotalk: () => null };
			if (name === 'react-icons/fa') return { FaTelegramPlane: () => null };
			if (name === 'react/jsx-runtime') return jsx;
			if (name === 'next/script') return Script;
			if (name === 'next/router') return { useRouter: () => router };
			if (name === 'next-i18next') return { useTranslation: () => ({ t: (k) => k }) };
			if (name === '../../hooks/useApi') return { useAction: () => action };
			if (name === '../../auth')
				return { safeReturnTo: (p) => (p.startsWith('/') && !p.startsWith('//') ? p : undefined) };
			if (name === '../common/UI') return { Button: () => null };
			if (name === './SocialSignup')
				return {
					__esModule: true,
					default: Signup,
					finishSocialSession: async (a, r, s, d) => {
						saved.push(s);
						routes.push(d || '/');
					},
				};
			throw Error(name);
		},
	};
	vm.runInNewContext(
		ts.transpileModule(fs.readFileSync(file, 'utf8'), {
			compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
		}).outputText,
		ctx,
	);
	const nodes = (n) =>
		!n || typeof n !== 'object' ? [] : [n, ...React.Children.toArray(n.props?.children).flatMap(nodes)];
	const render = () => {
		index = 0;
		effects.length = 0;
		return ctx.exports.default({ onSetupChange: (v) => setups.push(v) });
	};
	const flush = () => new Promise((r) => setImmediate(r));
	return {
		calls,
		routes,
		saved,
		setups,
		storage,
		redirects,
		replaced,
		action,
		render,
		nodes,
		Signup,
		flush,
		async start() {
			let tree = render();
			effects.forEach((f) => f());
			await flush();
			const script = nodes(tree).find((n) => n.type === Script);
			if (script) script.props.onReady();
			tree = render();
			effects.forEach((f) => f());
			await flush();
			return render();
		},
		async telegram(payload) {
			const button = nodes(render()).find(
				(n) => Array.isArray(n.props.children) && n.props.children.includes(' Telegram'),
			);
			assert.ok(button);
			button.props.onClick();
			callback(payload);
			await flush();
		},
		async kakao() {
			const button = nodes(render()).find(
				(n) => Array.isArray(n.props.children) && n.props.children.includes(' Kakao'),
			);
			assert.ok(button);
			await button.props.onClick();
			await flush();
		},
	};
}
const provider = 'libs/components/account/ProviderSignIn.tsx',
	callback = 'libs/components/account/KakaoCallback.tsx';
test('Telegram submits the SDK token with the server nonce and signs in returning users', async () => {
	const h = harness(provider, { session: { accessToken: 'fixture', user: { role: 'USER' } } });
	await h.start();
	await h.telegram({ id_token: 'signed-fixture' });
	const sdk = h.calls.find((c) => c.name === 'sdk');
	assert.equal(sdk.args.client_id, 12345);
	assert.deepEqual(Array.from(sdk.args.scope), ['profile']);
	assert.equal(sdk.args.nonce, 'a'.repeat(64));
	assert.equal(h.calls.find((c) => c.name === 'loginTelegram').args.input.idToken, 'signed-fixture');
	assert.equal(h.saved.length, 1);
});
test('Telegram signup hands only the verified signup ticket to contact completion', async () => {
	const h = harness(provider, { signupToken: 'c'.repeat(64), displayName: 'Member' });
	await h.start();
	await h.telegram({ id_token: 'signed-fixture' });
	assert.equal(h.saved.length, 0);
	assert.deepEqual(h.setups, [true]);
	const signup = h.nodes(h.render()).find((n) => n.type === h.Signup);
	assert.equal(signup.props.provider, 'TELEGRAM');
	assert.equal(signup.props.pending.signupToken, 'c'.repeat(64));
});
test('Telegram cancellation never creates a session and allows a new nonce', async () => {
	const h = harness(provider, null);
	await h.start();
	await h.telegram({ error: 'cancelled' });
	assert.equal(h.saved.length, 0);
	assert.equal(h.calls.filter((c) => c.name === 'loginTelegram').length, 0);
	const retry = h.nodes(h.render()).find((n) => n.props.children === 'Try again');
	assert.ok(retry);
	await retry.props.onClick();
	await h.flush();
	assert.equal(h.calls.filter((c) => c.name === 'beginSocialLogin').length, 2);
});
test('Kakao initiation stores state and a safe return route before leaving the site', async () => {
	const h = harness(provider, null, { returnTo: '/creators/member?inquiry=1' });
	await h.start();
	await h.kakao();
	const stored = JSON.parse(h.storage.get('creatorhub.kakaoAttempt'));
	assert.equal(stored.state, 'b'.repeat(64));
	assert.equal(stored.returnTo, '/creators/member?inquiry=1');
	assert.equal(h.redirects[0], 'https://kauth.kakao.com/oauth/authorize?fixture=1');
});
test('Kakao callback matches browser state, removes the code, exchanges once and resumes the original route', async () => {
	const h = harness(
		callback,
		{ session: { accessToken: 'fixture' } },
		{ code: 'one-use-code', state: 'b'.repeat(64) },
		{ state: 'b'.repeat(64), createdAt: Date.now(), returnTo: '/creators/member' },
	);
	await h.start();
	await h.flush();
	h.render();
	assert.equal(h.calls.filter((c) => c.name === 'loginKakao').length, 1);
	assert.equal(h.calls[0].args.input.code, 'one-use-code');
	assert.equal(h.storage.has('creatorhub.kakaoAttempt'), false);
	assert.deepEqual(h.replaced, ['/account/kakao-callback']);
	assert.deepEqual(h.routes, ['/creators/member']);
	assert.equal(h.saved.length, 1);
});
for (const [name, attempt, query] of [
	['mismatched state', { state: 'wrong', createdAt: Date.now() }, { code: 'code', state: 'b'.repeat(64) }],
	[
		'expired attempt',
		{ state: 'b'.repeat(64), createdAt: Date.now() - 11 * 60000 },
		{ code: 'code', state: 'b'.repeat(64) },
	],
	['missing attempt', undefined, { code: 'code', state: 'b'.repeat(64) }],
	[
		'cancelled consent',
		{ state: 'b'.repeat(64), createdAt: Date.now() },
		{ error: 'access_denied', state: 'b'.repeat(64) },
	],
])
	test(`Kakao rejects ${name} without a token exchange or local session`, async () => {
		const h = harness(callback, null, query, attempt);
		await h.start();
		await h.flush();
		assert.equal(h.calls.length, 0);
		assert.equal(h.saved.length, 0);
		assert.match(h.action.error, /expired|not completed/);
	});
