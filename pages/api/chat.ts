import { clientIp } from '../../libs/server/client-ip.cjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { answer, checkBody, quotaStatus } from '../../libs/server/chat.cjs';

export const config = { api: { bodyParser: { sizeLimit: '32kb' } } };

export default async function chat(request: NextApiRequest, response: NextApiResponse) {
	response.setHeader('Cache-Control', 'no-store');
	if (request.method !== 'POST') {
		response.setHeader('Allow', 'POST');
		return response.status(405).json({ error: 'Use POST.' });
	}
	const origin = request.headers.origin;
	if (origin) {
		try {
			if (new URL(origin).host !== request.headers.host)
				return response.status(403).json({ error: 'Request origin is not allowed.' });
		} catch {
			return response.status(403).json({ error: 'Request origin is not allowed.' });
		}
	}
	if (!checkBody(request.body))
		return response.status(400).json({ error: 'Write a message of up to 1,500 characters.' });
	const quota = quotaStatus(clientIp(request));
	if (!quota.allowed) {
		response.setHeader('Retry-After', String(quota.retryAfter));
		return response.status(429).json({ error: quota.error, retryAfter: quota.retryAfter });
	}

	const result = await answer(request.body);
	if (result.retryAfter) response.setHeader('Retry-After', String(result.retryAfter));
	return response.status(result.status).json(result);
}
