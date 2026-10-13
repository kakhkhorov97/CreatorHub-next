import type { NextApiRequest, NextApiResponse } from 'next';
import { clientIp } from '../../libs/server/client-ip.cjs';
export const config = { api: { bodyParser: { sizeLimit: '16kb' } } };
export default async function contact(request: NextApiRequest, response: NextApiResponse) {
	response.setHeader('Cache-Control', 'no-store');
	if (request.method !== 'POST') {
		response.setHeader('Allow', 'POST');
		return response.status(405).json({ error: 'Use POST.' });
	}
	try {
		if (!request.headers.origin || new URL(request.headers.origin).host !== request.headers.host)
			return response.status(403).json({ error: 'Request origin is not allowed.' });
	} catch {
		return response.status(403).json({ error: 'Request origin is not allowed.' });
	}
	const { name, email, message, website } = request.body || {};
	if (
		typeof name !== 'string' ||
		name.trim().length < 2 ||
		name.length > 100 ||
		/[\r\n]/.test(name) ||
		typeof email !== 'string' ||
		email.length > 254 ||
		!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
		typeof message !== 'string' ||
		message.trim().length < 10 ||
		message.length > 5000 ||
		website !== ''
	)
		return response.status(400).json({ error: 'Check your name, email and message.' });
	try {
		const endpoint = new URL(
			process.env.API_GRAPHQL_URL || process.env.NEXT_PUBLIC_API_GRAPHQL_URL || 'http://localhost:7001/graphql',
		);
		endpoint.pathname = '/contact';
		endpoint.search = '';
		endpoint.hash = '';
		const upstream = await fetch(endpoint, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': clientIp(request) },
			body: JSON.stringify({ name, email, message, website }),
			signal: AbortSignal.timeout(12000),
			redirect: 'error',
		});
		if (upstream.status === 429) {
			response.setHeader('Retry-After', upstream.headers.get('Retry-After') || '900');
			return response.status(429).json({ error: 'Please wait before sending another message.' });
		}
		if (!upstream.ok)
			return response.status(503).json({ error: 'Your message could not be delivered. Please try again later.' });
		return response.status(202).json({ accepted: true });
	} catch {
		return response.status(503).json({ error: 'Your message could not be delivered. Please try again later.' });
	}
}
