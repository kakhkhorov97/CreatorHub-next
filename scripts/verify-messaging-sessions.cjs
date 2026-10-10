const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { io } = require('socket.io-client');

exports.verifyMessagingSessions = async ({ port, op, backendRequire, password, account }) => {
	const sockets = [];
	function once(socket, event) {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				socket.off(event, done);
				reject(new Error(`Timeout: ${event}`));
			}, 5000);
			function done(value) {
				clearTimeout(timer);
				socket.off(event, done);
				resolve(value);
			}
			socket.on(event, done);
		});
	}
	async function connect(token) {
		const socket = io(`http://localhost:${port}/messaging`, {
			autoConnect: false,
			transports: ['websocket'],
			reconnection: false,
			auth: { token },
		});
		sockets.push(socket);
		const ready = once(socket, 'messaging:ready');
		socket.connect();
		await ready;
		return socket;
	}
	try {
		const customer = await op('login', { input: { email: 'client@frontend.test', password } });
		const creator = await op('login', { input: { email: 'phone@frontend.test', password } });
		const profile = await op('myCreatorProfile', {}, creator.accessToken);
		const createInquiry = (token, subject) =>
			op(
				'sendInquiry',
				{
					input: {
						creatorId: profile._id,
						subject,
						brief: 'A disposable inquiry to verify WebSocket session security.',
						clientRequestKey: randomUUID(),
					},
				},
				token,
			);
		let inquiry = await createInquiry(customer.accessToken, 'Session security verification');
		const payload = JSON.parse(Buffer.from(customer.accessToken.split('.')[1], 'base64url'));
		const { JwtService } = backendRequire('@nestjs/jwt');
		const jwt = new JwtService({ secret: process.env.JWT_SECRET });
		const token = jwt.sign(
			{ sub: payload.sub, sid: payload.sid },
			{ expiresIn: '2s', issuer: 'creatorhub', audience: 'creatorhub-web', algorithm: 'HS256' },
		);
		const expiredSocket = await connect(token);
		const expired = once(expiredSocket, 'session:expired');
		const disconnected = once(expiredSocket, 'disconnect');
		await expired;
		await disconnected;
		assert.equal(expiredSocket.connected, false);
		expiredSocket.auth = { token: customer.accessToken };
		const reauthenticated = once(expiredSocket, 'messaging:ready');
		expiredSocket.connect();
		await reauthenticated;
		assert.equal((await expiredSocket.timeout(5000).emitWithAck('inquiry:join', { inquiryId: inquiry._id })).ok, true);
		const revoked = await connect(customer.accessToken);
		await revoked.timeout(5000).emitWithAck('inquiry:join', { inquiryId: inquiry._id });
		const leaked = [];
		revoked.on('inquiry:changed', (event) => leaked.push(event));
		await op('logout', {}, customer.accessToken);
		const invalid = once(revoked, 'session:invalid');
		await op(
			'sendInquiryMessage',
			{
				input: {
					inquiryId: inquiry._id,
					expectedVersion: inquiry.version,
					body: 'Revoked sessions must not receive this reply.',
					clientMessageKey: randomUUID(),
				},
			},
			creator.accessToken,
		);
		await invalid;
		assert.equal(leaked.length, 0);
		const admin = await op('login', { input: { email: 'admin@frontend.test', password } });
		const suspended = await account('suspended-chat@frontend.test', 'Disposable Suspended Chat');
		inquiry = await createInquiry(suspended.accessToken, 'Suspended account check');
		const suspendedSocket = await connect(suspended.accessToken);
		await suspendedSocket.timeout(5000).emitWithAck('inquiry:join', { inquiryId: inquiry._id });
		const suspensionLeak = [];
		suspendedSocket.on('inquiry:changed', (event) => suspensionLeak.push(event));
		await op('setAccountSuspended', { userId: suspended.user._id, suspended: true }, admin.accessToken);
		const unavailable = once(suspendedSocket, 'session:invalid');
		await op(
			'sendInquiryMessage',
			{
				input: {
					inquiryId: inquiry._id,
					expectedVersion: inquiry.version,
					body: 'Suspended accounts must not receive this reply.',
					clientMessageKey: randomUUID(),
				},
			},
			creator.accessToken,
		);
		await unavailable;
		assert.equal(suspensionLeak.length, 0);
		return [
			'Expired WebSocket disconnects and reauthenticates before rejoining',
			'Revoked and suspended sessions cannot receive private message events',
		];
	} finally {
		sockets.forEach((socket) => socket.disconnect());
	}
};
