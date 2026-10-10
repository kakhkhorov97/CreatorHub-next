import type { KeyboardEvent } from 'react';

export function handleMessageKey(event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, canSend: boolean) {
	if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
	const form = event.currentTarget.form;
	if (!form) return;
	event.preventDefault();
	const submitter = form.querySelector?.<HTMLButtonElement | HTMLInputElement>(
		'button[type="submit"], input[type="submit"]',
	);
	if (canSend && !event.repeat && !submitter?.disabled) form.requestSubmit(submitter || undefined);
}
