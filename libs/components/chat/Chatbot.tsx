import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft, ArrowsIn, ArrowsOut, ChatCircle, PaperPlaneRight, UserCircle, X } from 'phosphor-react';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
	const [mounted, setMounted] = useState(false);
	const [mobile, setMobile] = useState(false);
	const [expanded, setExpanded] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [draft, setDraft] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState('');
	const [retryUntil, setRetryUntil] = useState(0);
	const [retrySeconds, setRetrySeconds] = useState(0);
	useEffect(() => {
		if (!retryUntil) return;
		const update = () => setRetrySeconds(Math.max(0, Math.ceil((retryUntil - Date.now()) / 1000)));
		update();
		const timer = window.setInterval(update, 1000);
		return () => window.clearInterval(timer);
	}, [retryUntil]);
	const input = useRef<HTMLTextAreaElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const transcript = useRef<HTMLDivElement>(null);
	const lock = useRef(false);
	useEffect(() => {
		setMounted(true);
		const media = window.matchMedia('(max-width: 700px)');
		const update = () => setMobile(media.matches);
		update();
		media.addEventListener('change', update);
		return () => media.removeEventListener('change', update);
	}, []);
	useEffect(() => {
		if (!open || !mobile) return;
		const scrollY = window.scrollY;
		const bodyStyle = document.body.getAttribute('style');
		const siblings = Array.from(document.body.children).filter((node) => node !== widget.current) as HTMLElement[];
		const inert = siblings.map((node) => node.inert);
		siblings.forEach((node) => {
			node.inert = true;
		});
		Object.assign(document.body.style, { position: 'fixed', top: `-${scrollY}px`, width: '100%', overflow: 'hidden' });
		widget.current?.querySelector<HTMLButtonElement>('.chat-back')?.focus({ preventScroll: true });
		return () => {
			siblings.forEach((node, index) => {
				node.inert = inert[index];
			});
			if (bodyStyle === null) document.body.removeAttribute('style');
			else document.body.setAttribute('style', bodyStyle);
			const behavior = document.documentElement.style.scrollBehavior;
			document.documentElement.style.scrollBehavior = 'auto';
			window.scrollTo({ top: scrollY, behavior: 'auto' });
			document.documentElement.style.scrollBehavior = behavior;
			trigger.current?.focus({ preventScroll: true });
		};
	}, [open, mobile]);
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
			element?.style.setProperty('--chat-viewport-top', `${viewport?.offsetTop ?? 0}px`);
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
			element?.style.removeProperty('--chat-viewport-top');
		};
	}, [open, mobile]);
	useEffect(() => {
		transcript.current?.scrollTo({ top: transcript.current.scrollHeight });
	}, [messages, busy]);

	function close() {
		setOpen(false);
		trigger.current?.focus({ preventScroll: true });
	}

	async function submit(event: FormEvent) {
		event.preventDefault();
		const version = generation.current;
		const message = draft.trim();
		if (!message || lock.current || Date.now() < retryUntil) return;
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
			if (response.status === 429) {
				const seconds = Math.max(
					1,
					Math.min(86400, Number(response.headers.get('Retry-After')) || result.retryAfter || 60),
				);
				setRetryUntil(Date.now() + seconds * 1000);
				setRetrySeconds(seconds);
			}
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
	if (!mounted || router.pathname.startsWith('/_admin')) return null;
	return createPortal(
		<div
			className={`chat-widget${open ? ' is-open' : ''}${mobile ? ' is-mobile' : ''}${expanded ? ' is-expanded' : ''}`}
			ref={widget}
		>
			{open && (
				<section
					className="chat-panel"
					role="dialog"
					aria-modal={mobile}
					aria-labelledby="chat-title"
					onKeyDown={(event) => {
						if (event.key === 'Escape') close();
						if (mobile && event.key === 'Tab') {
							const controls = Array.from(
								event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], textarea'),
							).filter((node) => node.getClientRects().length > 0);
							const first = controls[0];
							const last = controls[controls.length - 1];
							if (event.shiftKey && document.activeElement === first) {
								event.preventDefault();
								last?.focus();
							} else if (!event.shiftKey && document.activeElement === last) {
								event.preventDefault();
								first?.focus();
							}
						}
					}}
				>
					<header>
						{mobile && (
							<button className="icon-button chat-back" aria-label={translate('Back')} onClick={close}>
								<ArrowLeft size={22} />
							</button>
						)}
						<span className="assistant-avatar" aria-hidden="true">
							<ChatCircle size={22} weight="duotone" />
						</span>
						<div className="assistant-heading">
							<h2 id="chat-title">{translate('CreatorHub Assistant')}</h2>
							<p>{translate('Find creative work and get help')}</p>
						</div>
						{!mobile && (
							<button
								className="icon-button"
								aria-label={translate(expanded ? 'Collapse assistant' : 'Expand assistant')}
								onClick={() => setExpanded(!expanded)}
							>
								{expanded ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}
							</button>
						)}
						{!mobile && (
							<button className="icon-button" aria-label={translate('Close assistant')} onClick={close}>
								<X size={22} />
							</button>
						)}
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
									{['Find a creator', 'Explore projects', 'Publish my work'].map((question) => (
										<button
											key={translate(question)}
											onClick={() => {
												setDraft(translate(question));
												input.current?.focus();
											}}
										>
											{translate(question)}
										</button>
									))}
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
							{translate(error, { seconds: retrySeconds })}{' '}
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
						<Button
							type="submit"
							disabled={busy || retrySeconds > 0 || !draft.trim()}
							title={
								retrySeconds
									? translate('Please wait {{seconds}} seconds before sending another message.', {
											seconds: retrySeconds,
									  })
									: undefined
							}
							aria-label={translate('Send message')}
						>
							<PaperPlaneRight size={21} />
						</Button>
					</form>
				</section>
			)}
			<button
				ref={trigger}
				hidden={open}
				className="chat-trigger"
				aria-expanded={open}
				aria-label={open ? translate('Close CreatorHub assistant') : translate('Open CreatorHub assistant')}
				onClick={() => (open ? close() : setOpen(true))}
			>
				<ChatCircle size={25} />
				<span>{translate('Ask CreatorHub AI')}</span>
			</button>
		</div>,
		document.body,
	);
}
