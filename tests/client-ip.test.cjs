const test = require('node:test');
const assert = require('node:assert/strict');
const { clientIp } = require('../libs/server/client-ip.cjs');

test('forwarded addresses are trusted only behind the configured local proxy', () => {
	const original = process.env.TRUST_PROXY;
	const request = (remoteAddress, forwarded) => ({
		socket: { remoteAddress },
		headers: { 'x-forwarded-for': forwarded },
	});
	try {
		delete process.env.TRUST_PROXY;
		assert.equal(clientIp(request('127.0.0.1', '203.0.113.10')), '127.0.0.1');
		process.env.TRUST_PROXY = 'loopback';
		assert.equal(clientIp(request('203.0.113.20', '203.0.113.10')), '203.0.113.20');
		assert.equal(clientIp(request('127.0.0.1', '203.0.113.10')), '203.0.113.10');
		assert.equal(clientIp(request('::ffff:127.0.0.1', '2001:db8::1')), '2001:db8::1');
		assert.equal(clientIp(request('::1', 'spoofed, 203.0.113.10')), '203.0.113.10');
		assert.equal(clientIp(request('127.0.0.1', 'invalid')), '127.0.0.1');
		assert.equal(clientIp(request('127.0.0.1', ['203.0.113.10'])), '127.0.0.1');
	} finally {
		if (original === undefined) delete process.env.TRUST_PROXY;
		else process.env.TRUST_PROXY = original;
	}
});
