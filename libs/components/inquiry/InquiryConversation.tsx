import { ConfirmationPrompt } from '../common/ConfirmationPrompt';
import { EngagementFeedback } from './ServiceFeedback';
import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft, CaretDown, PaperPlaneTilt } from 'phosphor-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { useAction, documents } from '../../hooks/useApi';
import { useInquiryHistory } from '../../hooks/useInquiryHistory';
import { handleMessageKey } from '../../utils/messageKeyboard';
import { Inquiry, InquiryOutcome } from '../../types/creatorhub';
import {
	Button,
	date,
	Feedback,
	Field,
	label,
	money,
	Notice,
	Picture,
	QueryState,
	Status,
	TextArea,
} from '../common/UI';

export function Conversation({
	inquiry,
	isClient,
	refresh,
}: {
	inquiry: Inquiry;
	isClient: boolean;
	refresh: () => Promise<unknown>;
}) {
	const action = useAction();
	const messages = useInquiryHistory(inquiry._id, inquiry.version);
	const user = useReactiveVar(userVar)!;
	const [body, setBody] = useState('');
	const [detailsOpen, setDetailsOpen] = useState(false);
	const followMessages = useRef(true);
	const messagePane = useRef<HTMLDivElement>(null);
	const olderSentinel = useRef<HTMLDivElement>(null);
	const scrollAnchor = useRef<{ height: number; top: number } | null>(null);
	useLayoutEffect(() => {
		const pane = messagePane.current;
		if (!pane) return;
		if (scrollAnchor.current) {
			pane.scrollTop = scrollAnchor.current.top + pane.scrollHeight - scrollAnchor.current.height;
			scrollAnchor.current = null;
		} else if (followMessages.current) pane.scrollTop = pane.scrollHeight;
	}, [messages.rows.length, messages.rows[messages.rows.length - 1]?._id]);
	useEffect(() => {
		if (!messages.hasOlder || messages.loadingOlder || messages.error || !olderSentinel.current) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				const pane = messagePane.current;
				if (!entry.isIntersecting || !pane) return;
				scrollAnchor.current = { height: pane.scrollHeight, top: pane.scrollTop };
				messages.loadOlder();
			},
			{ root: messagePane.current, rootMargin: '80px 0px 0px' },
		);
		observer.observe(olderSentinel.current);
		return () => observer.disconnect();
	}, [messages.hasOlder, messages.loadingOlder, messages.error, messages.loadOlder]);
	useEffect(() => {
		if (messages.error) scrollAnchor.current = null;
	}, [messages.error]);
	const [finish, setFinish] = useState<'cancelInquiry' | 'declineInquiry' | 'closeInquiry' | null>(null);
	const [outcome, setOutcome] = useState<InquiryOutcome>('NOT_PROCEEDING');
	const key = useRef<string | null>(null);
	const active = ['SENT', 'IN_DISCUSSION'].includes(inquiry.status);
	const input = { inquiryId: inquiry._id, expectedVersion: inquiry.version };
	useEffect(() => {
		const timer = setInterval(() => {
			refresh().catch(() => {});
			messages.refresh().catch(() => {});
		}, 15000);
		return () => clearInterval(timer);
	}, [inquiry._id, inquiry.version]);
	useEffect(() => {
		if (
			messages.loading ||
			messages.error ||
			messages.observedVersion < inquiry.version ||
			!inquiry.unreadCount ||
			document.visibilityState !== 'visible'
		)
			return;
		let cancelled = false;
		action
			.mutate('markInquiryRead', { input: { inquiryId: inquiry._id, expectedVersion: inquiry.version } })
			.then(async () => {
				if (cancelled) return;
				await action.client.refetchQueries({
					include: [documents.getUnreadInquiryCount, documents.getUnreadNotificationCount],
				});
				await refresh();
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, [inquiry._id, inquiry.version, inquiry.unreadCount, messages.loading, messages.error, messages.observedVersion]);

	return (
		<>
			<div className="chat-thread">
				<section className="conversation" aria-label="Messages">
					<div className="conversation-heading">
						<Link passHref className="mobile-inbox-back" href="/inquiries" aria-label="Back to inbox">
							<ArrowLeft size={21} />
						</Link>
						<Picture avatar src={inquiry.counterpartyAvatarUrl} alt="" />
						<div className="chat-heading-copy">
							<h2>{inquiry.counterpartyName || 'Member'}</h2>
							<p>{inquiry.subject || 'Private inquiry'}</p>
						</div>
						<button
							type="button"
							className={`chat-details-toggle ${detailsOpen ? 'active' : ''}`}
							aria-expanded={detailsOpen}
							aria-controls={`inquiry-details-${inquiry._id}`}
							onClick={() => setDetailsOpen(!detailsOpen)}
						>
							Details <CaretDown size={16} />
						</button>
					</div>
					<QueryState
						loading={messages.loading && !messages.rows.length}
						error={messages.error}
						retry={() => messages.refresh()}
					/>
					<div
						className="message-list"
						ref={messagePane}
						onScroll={(event) => {
							const pane = event.currentTarget;
							followMessages.current = pane.scrollHeight - pane.scrollTop - pane.clientHeight < 80;
						}}
						role="log"
						aria-label="Conversation messages"
						aria-live="polite"
						aria-relevant="additions"
					>
						<div ref={olderSentinel} className="chat-older-sentinel">
							<QueryState loading={messages.loadingOlder} />
						</div>
						<div className="chat-start">
							<span>{date(inquiry.submittedAt)}</span>
							<p>{isClient ? 'You sent an inquiry' : 'You received an inquiry'}</p>
							<button type="button" onClick={() => setDetailsOpen(true)}>
								View original brief
							</button>
						</div>
						{!messages.loading && !messages.error && !messages.rows.length && (
							<p className="chat-no-replies">
								No replies yet. {active ? 'Start the conversation below.' : 'This conversation is closed.'}
							</p>
						)}
						{messages.rows.map((m) => (
							<article key={m._id} className={`message ${m.senderId === user._id ? 'mine' : ''}`}>
								<div className="row">
									<strong>{m.senderId === user._id ? 'You' : inquiry.counterpartyName || 'Member'}</strong>
									<time dateTime={m.createdAt}>
										{new Intl.DateTimeFormat('en', {
											month: 'short',
											day: 'numeric',
											hour: 'numeric',
											minute: '2-digit',
										}).format(new Date(m.createdAt))}
									</time>
								</div>
								<p>{m.body}</p>
								{m.senderId === user._id && <small>{m.readAt ? 'Read' : 'Sent'}</small>}
							</article>
						))}
					</div>
					{active ? (
						<form
							className="message-form"
							onSubmit={(e) => {
								e.preventDefault();
								if (!body.trim()) return;
								action.run(async () => {
									key.current ??= crypto.randomUUID();
									await action.mutate('sendInquiryMessage', {
										input: { ...input, clientMessageKey: key.current, body: body.trim() },
									});
									key.current = null;
									setBody('');
									followMessages.current = true;
									await refresh();
									await messages.refresh();
								});
							}}
						>
							<TextArea
								label="Message"
								rows={2}
								readOnly={action.busy}
								aria-describedby={`message-hint-${inquiry._id}`}
								onKeyDown={(event) => handleMessageKey(event, !action.busy && !!body.trim())}
								value={body}
								onChange={(e) => {
									setBody(e.target.value);
									key.current = null;
								}}
								required
								minLength={1}
								maxLength={5000}
								placeholder="Write a message…"
							/>
							<Button type="submit" disabled={action.busy || !body.trim()}>
								<PaperPlaneTilt size={19} />
								{action.busy ? 'Sending…' : 'Send'}
							</Button>
							<small className="chat-key-hint" id={`message-hint-${inquiry._id}`}>
								Enter to send · Shift+Enter for a new line
							</small>
						</form>
					) : (
						<Notice>This conversation is {label(inquiry.status).toLowerCase()}.</Notice>
					)}
					<Feedback {...action} />
					{action.error && (
						<Button
							secondary
							onClick={() =>
								action.run(async () => {
									await refresh();
									await messages.refresh();
								})
							}
						>
							Load latest conversation
						</Button>
					)}
				</section>
				<aside className="inquiry-details" id={`inquiry-details-${inquiry._id}`} hidden={!detailsOpen}>
					<div className="chat-brief-heading">
						<h3>Original inquiry</h3>
						<Status value={inquiry.status} />
					</div>
					<dl>
						<dt>Project brief</dt>
						<dd className="prose-text">{inquiry.brief}</dd>
						<dt>Budget</dt>
						<dd>
							{inquiry.budgetMin != null || inquiry.budgetMax != null
								? `${inquiry.budgetMin != null ? money(inquiry.budgetMin) : 'Not specified'} – ${
										inquiry.budgetMax != null ? money(inquiry.budgetMax) : 'Not specified'
								  }`
								: 'Not specified'}
						</dd>
						<dt>Submitted</dt>
						<dd>{date(inquiry.submittedAt)}</dd>
						<dt>Desired deadline</dt>
						<dd>{date(inquiry.desiredDeadline)}</dd>
						{inquiry.serviceSnapshot && (
							<>
								<dt>Selected service at submission</dt>
								<dd>
									<strong>{inquiry.serviceSnapshot.title}</strong>
									<p>
										{inquiry.serviceSnapshot.pricingType === 'STARTING_AT'
											? money(inquiry.serviceSnapshot.startingPrice)
											: 'Custom quote'}
									</p>
									<ul>
										{inquiry.serviceSnapshot.deliverables.map((d) => (
											<li key={d}>{d}</li>
										))}
									</ul>
								</dd>
							</>
						)}
					</dl>
					{inquiry.outcome && <p>Outcome: {label(inquiry.outcome)}</p>}
					{active && (
						<div className="stack-actions">
							{inquiry.status === 'SENT' && (
								<Button secondary onClick={() => setFinish(isClient ? 'cancelInquiry' : 'declineInquiry')}>
									{isClient ? 'Cancel inquiry' : 'Decline inquiry'}
								</Button>
							)}
							{(isClient || inquiry.status === 'IN_DISCUSSION') && (
								<Button secondary onClick={() => setFinish('closeInquiry')}>
									Close inquiry
								</Button>
							)}
						</div>
					)}
					<EngagementFeedback inquiry={inquiry} isClient={isClient} refresh={refresh} />
				</aside>
			</div>
			{finish && (
				<ConfirmationPrompt onCancel={() => setFinish(null)} busy={action.busy}>
					<h2>
						{finish === 'closeInquiry'
							? 'Close inquiry'
							: finish === 'cancelInquiry'
							? 'Cancel inquiry'
							: 'Decline inquiry'}
						?
					</h2>
					{finish === 'closeInquiry' && (
						<Field label="Outcome">
							<select value={outcome} onChange={(e) => setOutcome(e.target.value as InquiryOutcome)}>
								<option value="NOT_PROCEEDING">Not proceeding</option>
								{inquiry.status === 'IN_DISCUSSION' && <option value="AGREED_TO_PROCEED">Agreed to proceed</option>}
								{isClient &&
									inquiry.status === 'SENT' &&
									inquiry.submittedAt &&
									Date.now() - new Date(inquiry.submittedAt).getTime() >= 7 * 86400000 && (
										<option value="NO_RESPONSE">No response</option>
									)}
							</select>
						</Field>
					)}
					<p>You will not be able to send further messages.</p>
					<div className="actions">
						<Button
							disabled={action.busy}
							onClick={() =>
								action.run(async () => {
									if (finish === 'closeInquiry') await action.mutate(finish, { input: { ...input, outcome } });
									else await action.mutate(finish, { input });
									setFinish(null);
									await refresh();
								})
							}
						>
							Confirm
						</Button>
						<Button secondary onClick={() => setFinish(null)}>
							Keep open
						</Button>
					</div>
				</ConfirmationPrompt>
			)}
		</>
	);
}
