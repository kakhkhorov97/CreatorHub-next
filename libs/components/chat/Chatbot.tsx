import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ChatCircle, PaperPlaneRight, UserCircle, X } from 'phosphor-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
import { Picture } from '../common/UI';
import { Button } from '../common/UI';

type Message = {
	role: 'user' | 'assistant';
	text: string;
	links?: Array<{ title: string; href: string; kind: string }>;
};

export default function Chatbot() {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const user = useReactiveVar(userVar);
	const widget = useRef<HTMLDivElement>(null);
	const generation = useRef(0);
	useEffect(() => {
		generation.current++;
		setMessages([]);
		setDraft('');
		setError('');
	}, [user?._id]);
	useEffect(() => {
		const outside = (event: PointerEvent) => {
			if (event.target instanceof Node && !widget.current?.contains(event.target)) setOpen(false);
		};
		document.addEventListener('pointerdown', outside);
		return () => document.removeEventListener('pointerdown', outside);
	}, []);
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
		if (open && !window.matchMedia('(max-width: 700px)').matches) input.current?.focus();
	}, [open]);
	useEffect(() => {
		if (!open) return;
		const element = widget.current;
		const viewport = window.visualViewport;
		const updateViewport = () => {
			const height = viewport?.height ?? window.innerHeight;
			const inset = Math.max(0, window.innerHeight - height - (viewport?.offsetTop ?? 0));
			element?.style.setProperty('--chat-viewport-height', `${height}px`);
			element?.style.setProperty('--chat-keyboard-inset', `${inset}px`);
		};
		updateViewport();
		viewport?.addEventListener('resize', updateViewport);
		viewport?.addEventListener('scroll', updateViewport);
		window.addEventListener('resize', updateViewport);
		return () => {
			viewport?.removeEventListener('resize', updateViewport);
			viewport?.removeEventListener('scroll', updateViewport);
			window.removeEventListener('resize', updateViewport);
			element?.style.removeProperty('--chat-viewport-height');
			element?.style.removeProperty('--chat-keyboard-inset');
		};
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
		const version = generation.current;
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
				body: JSON.stringify({ message, history, locale: router.locale }),
			});
			const result = await response.json();
			if (version !== generation.current) return;
			if (!response.ok) throw new Error(result.error || 'The assistant could not respond.');
			setMessages([...next, { role: 'assistant', text: result.reply, links: result.links }]);
		} catch (failure) {
			if (version !== generation.current) return;
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
		<div className="chat-widget" ref={widget}>
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
						<span className="assistant-avatar" aria-hidden="true">
							<ChatCircle size={22} weight="duotone" />
						</span>
						<div className="assistant-heading">
							<h2 id="chat-title">{translate('CreatorHub Assistant')}</h2>
							<p>{translate('Find creative work and get help')}</p>
						</div>
						<button className="icon-button" aria-label={translate('Close assistant')} onClick={close}>
							<X size={22} />
						</button>
					</header>
					<div className="chat-transcript" ref={transcript} role="log" aria-live="polite" aria-relevant="additions">
						{messages.length === 0 && (
							<div className="chat-welcome">
								<p>{translate('Hi! What can I help you find?')}</p>
								<p>
									{translate(
										'I can help you discover creators, projects and services, and explain how to use CreatorHub. What would you like to do?',
									)}
								</p>
								<div className="chat-suggestions">
									{['How do I find a creator?', 'How do I publish my work?', 'Find designers in Gwangju'].map(
										(question) => (
											<button
												key={translate(question)}
												onClick={() => {
													setDraft(question);
													input.current?.focus();
												}}
											>
												{translate(question)}
											</button>
										),
									)}
								</div>
								<small>{translate('AI answers may be incomplete. Check the linked profiles and services.')}</small>
							</div>
						)}
						{messages.map((message, index) => (
							<div key={index} className={`chat-entry ${message.role}`}>
								{message.role === 'user' && user ? (
									<Picture avatar src={user.avatarUrl} alt="" />
								) : (
									<span className="assistant-avatar" aria-hidden="true">
										{message.role === 'assistant' ? (
											<ChatCircle size={18} weight="duotone" />
										) : (
											<UserCircle size={22} />
										)}
									</span>
								)}
								<div className={`chat-message ${message.role}`}>
									<div className="chat-message-author">
										<small>
											{message.role === 'user' ? user?.displayName || translate('You') : translate('CreatorHub')}
										</small>
									</div>
									<p>{message.text}</p>
									{!!message.links?.length && (
										<details>
											<summary>{translate('Browse matching website results')}</summary>
											{message.links.map((link) => (
												<Link passHref key={link.href} href={link.href} onClick={close}>
													{link.title}
													<small>{link.kind}</small>
												</Link>
											))}
										</details>
									)}
								</div>
							</div>
						))}
						{busy && (
							<p className="chat-thinking" role="status">
								{translate('One moment, I’m checking that for you…')}
							</p>
						)}
					</div>
					{error && (
						<p className="chat-error" role="alert">
							{translate(error)}{' '}
							<Link passHref href="/faq">
								{translate('Visit FAQ')}
							</Link>
						</p>
					)}
					<form onSubmit={submit}>
						<label className="sr-only" htmlFor="chat-message">
							{translate('Your message')}
						</label>
						<textarea
							ref={input}
							id="chat-message"
							value={draft}
							onChange={(event) => setDraft(event.target.value)}
							onKeyDown={(event) => {
								if (
									event.key === 'Enter' &&
									!event.shiftKey &&
									!event.nativeEvent.isComposing &&
									event.keyCode !== 229
								) {
									event.preventDefault();
									if (!event.repeat) event.currentTarget.form?.requestSubmit();
								}
							}}
							maxLength={1500}
							rows={2}
							placeholder={translate('Ask about CreatorHub…')}
							required
						/>
						<Button type="submit" disabled={busy || !draft.trim()} aria-label={translate('Send message')}>
							<PaperPlaneRight size={21} />
						</Button>
					</form>
				</section>
			)}
			<button
				ref={trigger}
				className="chat-trigger"
				aria-expanded={open}
				aria-label={open ? translate('Close CreatorHub assistant') : translate('Open CreatorHub assistant')}
				onClick={() => (open ? close() : setOpen(true))}
			>
				<ChatCircle size={25} />
				<span>{translate('Ask CreatorHub AI')}</span>
			</button>
		</div>
	);
}
