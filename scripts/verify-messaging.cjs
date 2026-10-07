const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { io } = require('socket.io-client');

// Called only by integration.cjs with its disposable replica-set accounts.
exports.verifyMessaging = async function ({ port, op, customer, creator, outsider, admin, inquiryId, draftId }) {
	const sockets = [];
	const url = `http://localhost:${port}/messaging`;
	function once(socket, event, timeout = 5000) {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				socket.off(event, done);
				reject(new Error(`Timed out waiting for ${event}`));
			}, timeout);
			function done(value) {
				clearTimeout(timer);
				socket.off(event, done);
				resolve(value);
			}
			socket.on(event, done);
		});
	}
	async function connect(token, origin) {
		const socket = io(url, {
			autoConnect: false,
			transports: ['websocket'],
			reconnection: false,
			auth: { token },
			...(origin ? { extraHeaders: { Origin: origin } } : {}),
		});
		sockets.push(socket);
		const ready = once(socket, 'messaging:ready');
		ready.catch(() => {});
		const failed = new Promise((_, reject) => socket.once('connect_error', reject));
		socket.connect();
		await Promise.race([ready, failed]);
		assert.equal(socket.io.engine.transport.name, 'websocket');
		return socket;
	}
	async function rejectedConnection(token, origin) {
		const socket = io(url, {
			autoConnect: false,
			transports: ['websocket'],
			reconnection: false,
			auth: { token },
			...(origin ? { extraHeaders: { Origin: origin } } : {}),
		});
		sockets.push(socket);
		const rejected = once(socket, 'connect_error');
		socket.connect();
		await rejected;
		assert.equal(socket.connected, false);
	}
	function request(socket, event, payload) {
		return socket.timeout(5000).emitWithAck(event, payload);
	}
	const report = [];
	try {
		await rejectedConnection('invalid-token');
		await rejectedConnection(customer, 'https://untrusted.example');
		report.push('Unauthenticated and wrong-origin connections rejected');
		const cs = await connect(customer),
			cr = await connect(creator),
			os = await connect(outsider),
			as = await connect(admin);
		const unjoined = await connect(creator);
		const outsiderEvents = [],
			unjoinedRoomEvents = [],
			inboxEvents = [];
		os.on('inbox:changed', (event) => outsiderEvents.push(event));
		os.on('inquiry:changed', (event) => outsiderEvents.push(event));
		as.on('inbox:changed', (event) => outsiderEvents.push(event));
		as.on('inquiry:changed', (event) => outsiderEvents.push(event));
		unjoined.on('inquiry:changed', (event) => unjoinedRoomEvents.push(event));
		unjoined.on('inbox:changed', (event) => inboxEvents.push(event));
		for (const socket of [cs, cr]) assert.equal((await request(socket, 'inquiry:join', { inquiryId })).ok, true);
		for (const socket of [os, as])
			assert.equal((await request(socket, 'inquiry:join', { inquiryId })).error.code, '403');
		assert.equal((await request(cr, 'inquiry:join', { inquiryId: draftId })).ok, false);
		assert.equal((await request(cs, 'inquiry:join', { inquiryId: 'not-an-id' })).ok, false);
		assert.equal((await request(cs, 'inquiry:join', { inquiryId, userId: 'spoofed' })).ok, false);
		report.push('Only participants join; administrators, outsiders, private drafts and spoofed inputs denied');
		let inquiry = await op('getInquiry', { inquiryId }, customer);
		const input = {
			inquiryId,
			expectedVersion: inquiry.version,
			clientMessageKey: randomUUID(),
			body: 'WebSocket delivery verification',
		};
		const received = once(cr, 'inquiry:changed');
		const before = performance.now();
		const acknowledgement = await request(cs, 'message:send', input);
		assert.equal(acknowledgement.ok, true, JSON.stringify(acknowledgement));
		const event = await received;
		assert.equal(event.message._id, acknowledgement.data._id);
		assert.equal(event.message.body, input.body);
		assert.equal(event.version, inquiry.version + 1);
		report.push(`Saved message delivered over WebSocket in ${Math.round(performance.now() - before)} ms locally`);
		const history = await op('getInquiryMessages', { inquiryId, input: { limit: 50 } }, creator);
		assert.equal(history.filter((message) => message.clientMessageKey === input.clientMessageKey).length, 1);
		const retry = await request(cs, 'message:send', input);
		assert.equal(retry.data._id, acknowledgement.data._id);
		assert.equal((await request(cs, 'message:send', { ...input, body: 'Changed retry content' })).error.code, '409');
		assert.equal((await request(os, 'message:send', { ...input, clientMessageKey: randomUUID() })).error.code, '403');
		assert.equal(
			(await request(cs, 'message:send', { ...input, body: ' '.repeat(2), clientMessageKey: randomUUID() })).ok,
			false,
		);
		assert.equal(
			(await request(cs, 'message:send', { ...input, body: 'x'.repeat(5001), clientMessageKey: randomUUID() })).ok,
			false,
		);
		const failedKey = randomUUID();
		assert.equal(
			(await request(cs, 'message:send', { ...input, clientMessageKey: failedKey, expectedVersion: 0 })).ok,
			false,
		);
		assert.ok(
			!(await op('getInquiryMessages', { inquiryId }, customer)).some(
				(message) => message.clientMessageKey === failedKey,
			),
		);
		report.push('Acknowledged messages persist; retries deduplicate; stale writes roll back; invalid bodies rejected');
		inquiry = await op('getInquiry', { inquiryId }, customer);
		const raceInput = {
			...input,
			expectedVersion: inquiry.version,
			clientMessageKey: randomUUID(),
			body: 'Concurrent duplicate retry',
		};
		const race = await Promise.all([request(cs, 'message:send', raceInput), request(cs, 'message:send', raceInput)]);
		assert.ok(race.every((result) => result.ok));
		assert.equal(race[0].data._id, race[1].data._id);
		assert.equal(
			(await op('getInquiryMessages', { inquiryId }, customer)).filter(
				(message) => message.clientMessageKey === raceInput.clientMessageKey,
			).length,
			1,
		);
		report.push('Concurrent retries produce one persisted message');
		inquiry = await op('getInquiry', { inquiryId }, creator);
		assert.ok(inquiry.unreadCount > 0);
		const readEvent = once(cs, 'inquiry:changed');
		await op('markInquiryRead', { input: { inquiryId, expectedVersion: inquiry.version } }, creator);
		assert.equal((await readEvent).kind, 'read');
		assert.equal((await op('getInquiry', { inquiryId }, creator)).unreadCount, 0);
		assert.ok(
			(await op('getInquiryMessages', { inquiryId }, customer)).find(
				(message) => message._id === acknowledgement.data._id,
			).readAt,
		);
		report.push('Read receipts and unread counts update through events');
		cs.disconnect();
		inquiry = await op('getInquiry', { inquiryId }, creator);
		const missed = await op(
			'sendInquiryMessage',
			{
				input: {
					inquiryId,
					expectedVersion: inquiry.version,
					clientMessageKey: randomUUID(),
					body: 'Saved while the other participant was offline',
				},
			},
			creator,
		);
		const readyAgain = once(cs, 'messaging:ready');
		cs.connect();
		await readyAgain;
		assert.equal((await request(cs, 'inquiry:join', { inquiryId })).ok, true);
		assert.ok((await op('getInquiryMessages', { inquiryId }, customer)).some((message) => message._id === missed._id));
		report.push(
			'Reconnected participant rejoins and recovers missed database history; GraphQL writes also emit live events',
		);
		assert.ok(inboxEvents.length > 0);
		assert.ok(inboxEvents.every((event) => !('body' in event) && !('message' in event)));
		assert.equal(unjoinedRoomEvents.length, 0);
		assert.equal(outsiderEvents.length, 0);
		report.push('Account rooms receive inbox invalidations only; message bodies stay in joined participant rooms');
		await request(cs, 'inquiry:leave', { inquiryId });
		inquiry = await op('getInquiry', { inquiryId }, customer);
		const creatorChanges = once(cr, 'inquiry:changed');
		await op(
			'closeInquiry',
			{ input: { inquiryId, expectedVersion: inquiry.version, outcome: 'AGREED_TO_PROCEED' } },
			customer,
		);
		assert.equal((await creatorChanges).kind, 'inquiry');
		assert.equal(
			(
				await request(cr, 'message:send', {
					...input,
					expectedVersion: inquiry.version + 1,
					clientMessageKey: randomUUID(),
				})
			).ok,
			false,
		);
		report.push('Closure reaches the peer immediately and closed conversations reject new replies');
		return report;
	} finally {
		sockets.forEach((socket) => socket.disconnect());
	}
};
