const { isIP } = require('node:net');

function clientIp(request) {
	const remote = request.socket.remoteAddress || 'unknown';
	const loopback = remote === '::1' || /^(?:::ffff:)?127\./.test(remote);
	if (process.env.TRUST_PROXY !== 'loopback' || !loopback) return remote;
	const forwarded = request.headers['x-forwarded-for'];
	if (typeof forwarded !== 'string') return remote;
	// Nginx must overwrite X-Forwarded-For with $remote_addr for this site.
	const addresses = forwarded.split(',').map((address) => address.trim());
	const nearest = addresses[addresses.length - 1];
	return isIP(nearest) ? nearest : remote;
}

module.exports = { clientIp };
