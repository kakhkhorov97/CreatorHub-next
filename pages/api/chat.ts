import { clientIp } from '../../libs/server/client-ip.cjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { answer, checkBody, takeQuota } from '../../libs/server/chat.cjs';

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
	if (!takeQuota(clientIp(request))) {
		response.setHeader('Retry-After', '60');
		return response.status(429).json({ error: 'The assistant is busy. Please try again later.' });
	}
	const result = await answer(request.body);
	return response.status(result.status).json(result);
}
