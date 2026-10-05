import type { KeyboardEvent } from 'react';

export function handleMessageKey(event: KeyboardEvent<HTMLTextAreaElement>, canSend: boolean) {
	if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;
	event.preventDefault();
	if (canSend && !event.repeat) event.currentTarget.form?.requestSubmit();
}
