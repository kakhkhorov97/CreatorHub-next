import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChatCircle, PaperPlaneRight, X } from 'phosphor-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from '../common/UI';

type Message = {
	role: 'user' | 'assistant';
	text: string;
	links?: Array<{ title: string; href: string; kind: string }>;
};

export default function Chatbot() {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [draft, setDraft] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const input = useRef<HTMLTextAreaElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const transcript = useRef<HTMLDivElement>(null);
	const lock = useRef(false);
	useEffect(() => {
		if (open) input.current?.focus();
	}, [open]);
	useEffect(() => {
		transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
	}, [messages, busy]);

	function close() {
		setOpen(false);
		trigger.current?.focus();
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		const message = draft.trim();
		if (!message || lock.current) return;
		lock.current = true;
		setBusy(true);
		setError('');
		const history = messages.slice(-8).map(({ role, text }) => ({ role, text: text.slice(0, 3000) }));
		const next: Message[] = [...messages, { role: 'user', text: message }];
		setMessages(next);
		setDraft('');
		try {
			const response = await fetch('/api/chat', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ message, history }),
			});
			const result = await response.json();
			if (!response.ok) throw new Error(result.error || 'The assistant could not respond.');
			setMessages([...next, { role: 'assistant', text: result.reply, links: result.links }]);
		} catch (failure) {
			setError(failure instanceof Error ? failure.message : 'Please try again.');
			setMessages(messages);
			setDraft(message);
		} finally {
			setBusy(false);
			lock.current = false;
		}
	}
	if (router.pathname.startsWith('/_admin')) return null;
	return (
		<div className="chat-widget">
			{open && (
				<section
					className="chat-panel"
					role="dialog"
					aria-modal="false"
					aria-labelledby="chat-title"
					onKeyDown={(event) => {
						if (event.key === 'Escape') close();
					}}
				>
					<header>
						<div>
							<h2 id="chat-title">Ask CreatorHub AI</h2>
							<p>Find creative work and get help in Korea</p>
						</div>
						<button className="icon-button" aria-label="Close assistant" onClick={close}>
							<X size={22} />
						</button>
					</header>
					<div className="chat-transcript" ref={transcript} role="log" aria-live="polite" aria-relevant="additions">
						{!messages.length && (
							<div className="chat-welcome">
								<p>How can I help you with CreatorHub?</p>
								<div>
									{['How do I find a creator?', 'How do I publish my work?', 'Find designers in Gwangju'].map(
										(question) => (
											<button
												key={question}
												onClick={() => {
													setDraft(question);
													input.current?.focus();
												}}
											>
												{question}
											</button>
										),
									)}
								</div>
								<small>AI answers may be incomplete. Check the linked profiles and services.</small>
							</div>
						)}
						{messages.map((message, index) => (
							<div key={index} className={`chat-message ${message.role}`}>
								<small>{message.role === 'user' ? 'You' : 'CreatorHub'}</small>
								<p>{message.text}</p>
								{!!message.links?.length && (
									<details>
										<summary>Browse matching website results</summary>
										{message.links.map((link) => (
											<Link passHref key={link.href} href={link.href} onClick={close}>
												{link.title}
												<small>{link.kind}</small>
											</Link>
										))}
									</details>
								)}
							</div>
						))}
						{busy && <p role="status">Looking into that…</p>}
					</div>
					{error && (
						<p className="chat-error" role="alert">
							{error}{' '}
							<Link passHref href="/help">
								Visit Help
							</Link>
						</p>
					)}
					<form onSubmit={submit}>
						<label className="sr-only" htmlFor="chat-message">
							Your message
						</label>
						<textarea
							ref={input}
							id="chat-message"
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							maxLength={1500}
							rows={2}
							placeholder="Ask about CreatorHub…"
							required
						/>
						<Button type="submit" disabled={busy || !draft.trim()} aria-label="Send message">
							<PaperPlaneRight size={21} />
						</Button>
					</form>
				</section>
			)}
			<button
				ref={trigger}
				className="chat-trigger"
				aria-expanded={open}
				aria-label={open ? 'Close CreatorHub assistant' : 'Open CreatorHub assistant'}
				onClick={() => (open ? close() : setOpen(true))}
			>
				<ChatCircle size={25} />
				<span>Ask CreatorHub</span>
			</button>
		</div>
	);
}
