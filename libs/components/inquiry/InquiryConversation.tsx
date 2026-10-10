import { useMessaging, useMessagingEvents, useMessagingRefresh } from '../../messaging/MessagingProvider';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import { ConfirmationPrompt } from '../common/ConfirmationPrompt';
import { EngagementFeedback } from './ServiceFeedback';
import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft, CaretDown, PaperPlaneTilt } from 'phosphor-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { useAction } from '../../hooks/useApi';
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
	const { t: translate, i18n } = useSiteTranslation('common');

	const action = useAction();
	const messaging = useMessaging();
	const [roomError, setRoomError] = useState('');
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
	const liveVersion = useRef(inquiry.version);
	liveVersion.current = Math.max(liveVersion.current, inquiry.version);
	const input = { inquiryId: inquiry._id, expectedVersion: liveVersion.current };
	useEffect(() => {
		if (messaging.state !== 'connected') return;
		let cancelled = false;
		messaging
			.join(inquiry._id)
			.then(async () => {
				if (cancelled) return;
				setRoomError('');
				await messages.refresh(true);
			})
			.catch((error) => {
				if (!cancelled) setRoomError(error.message);
			});
		return () => {
			cancelled = true;
			messaging.leave(inquiry._id);
		};
	}, [inquiry._id, messaging.state, messaging.join, messaging.leave]);
	useMessagingEvents((event) => {
		if (event.type !== 'sync' && event.change.inquiryId === inquiry._id)
			liveVersion.current = Math.max(liveVersion.current, event.change.version);
		if (event.type === 'conversation' && event.change.inquiryId === inquiry._id && event.change.message)
			messages.append(event.change.message, event.change.version);
	});
	useMessagingRefresh(
		(event) =>
			event.type === 'sync' ||
			(event.type === 'conversation' && event.change.inquiryId === inquiry._id && !event.change.message),
		() => messages.refresh(true),
	);

	useEffect(() => {
		if (
			messages.loading ||
			messages.error ||
			messages.observedVersion < inquiry.version ||
			!inquiry.unreadCount ||
			document.visibilityState !== 'visible'
		)
			return;
		// The committed read event refreshes the thread, list and badges.
		void action
			.mutate('markInquiryRead', { input: { inquiryId: inquiry._id, expectedVersion: inquiry.version } })
			.catch(() => {});
	}, [inquiry._id, inquiry.version, inquiry.unreadCount, messages.loading, messages.error, messages.observedVersion]);

	return (
		<>
			<div className="chat-thread">
				<section className="conversation" aria-label={translate('Messages')}>
					<div className="conversation-heading">
						<Link passHref className="mobile-inbox-back" href="/inquiries" aria-label={translate('Back to inbox')}>
							<ArrowLeft size={21} />
						</Link>
						<Picture avatar src={inquiry.counterpartyAvatarUrl} alt="" />
						<div className="chat-heading-copy">
							<h2>{inquiry.counterpartyName || translate('Member')}</h2>
							<p>{inquiry.subject || translate('Private inquiry')}</p>
							{messaging.state !== 'connected' && (
								<small role="status">{translate('Reconnecting to messages… Your draft is kept.')}</small>
							)}
						</div>
						<button
							type="button"
							className={`chat-details-toggle ${detailsOpen ? 'active' : ''}`}
							aria-expanded={detailsOpen}
							aria-controls={`inquiry-details-${inquiry._id}`}
							onClick={() => setDetailsOpen(!detailsOpen)}
						>
							{translate('Details')} <CaretDown size={16} />
						</button>
					</div>
					<section className="chat-original-brief" aria-label={translate('Original inquiry')}>
						<h3>{translate('Original inquiry')}</h3>
						<p className="prose-text">{inquiry.brief}</p>
					</section>
					<QueryState
						loading={false}
						error={roomError ? new Error(roomError) : undefined}
						retry={async () => {
							try {
								await messaging.join(inquiry._id);
								setRoomError('');
								await refresh();
								await messages.refresh(true);
							} catch (error) {
								setRoomError(error instanceof Error ? error.message : 'Could not load messages.');
							}
						}}
					/>
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
						aria-label={translate('Conversation messages')}
						aria-live="polite"
						aria-relevant="additions"
					>
						<div ref={olderSentinel} className="chat-older-sentinel">
							<QueryState loading={messages.loadingOlder} />
						</div>
						<div className="chat-start">
							<span>{date(inquiry.submittedAt)}</span>
							<p>{isClient ? translate('You sent an inquiry') : translate('You received an inquiry')}</p>
						</div>
						{!messages.loading && !messages.error && !messages.rows.length && (
							<p className="chat-no-replies">
								{translate('No replies yet.')}{' '}
								{active ? translate('Start the conversation below.') : translate('This conversation is closed.')}
							</p>
						)}
						{messages.rows.map((m) => (
							<article key={m._id} className={`message ${m.senderId === user._id ? 'mine' : ''}`}>
								<div className="row">
									<strong>
										{m.senderId === user._id ? translate('You') : inquiry.counterpartyName || translate('Member')}
									</strong>
									<time dateTime={m.createdAt}>
										{new Intl.DateTimeFormat(i18n.language, {
											month: 'short',
											day: 'numeric',
											hour: 'numeric',
											minute: '2-digit',
										}).format(new Date(m.createdAt))}
									</time>
								</div>
								<p>{m.body}</p>
								{m.senderId === user._id && <small>{m.readAt ? translate('Read') : translate('Sent')}</small>}
							</article>
						))}
					</div>
					{active ? (
						<form
							className="message-form"
							onSubmit={(e) => {
								e.preventDefault();
								if (!body.trim() || messaging.state !== 'connected' || roomError) return;
								action.run(async () => {
									key.current ??= crypto.randomUUID();
									const message = await messaging.send({
										...input,
										expectedVersion: liveVersion.current,
										clientMessageKey: key.current,
										body: body.trim(),
									});
									messages.append(message, inquiry.version);
									key.current = null;
									setBody('');
									followMessages.current = true;
									// Live events update the version, list and badges without duplicate queries.
								});
							}}
						>
							<TextArea
								label={translate('Message')}
								rows={2}
								readOnly={action.busy}
								aria-describedby={`message-hint-${inquiry._id}`}
								onKeyDown={(event) =>
									handleMessageKey(
										event,
										!action.busy && !!body.trim() && messaging.state === 'connected' && !roomError,
									)
								}
								value={body}
								onChange={(e) => {
									setBody(e.target.value);
									key.current = null;
								}}
								required
								minLength={1}
								maxLength={5000}
								placeholder={translate('Write a message…')}
							/>
							<Button
								type="submit"
								disabled={action.busy || !body.trim() || messaging.state !== 'connected' || !!roomError}
							>
								<PaperPlaneTilt size={19} />
								{action.busy ? translate('Sending…') : translate('Send')}
							</Button>
							<small className="chat-key-hint" id={`message-hint-${inquiry._id}`}>
								{translate('Enter to send · Shift+Enter for a new line')}
							</small>
						</form>
					) : (
						<Notice>
							{translate('This conversation is')} {label(inquiry.status).toLowerCase()}.
						</Notice>
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
							{translate('Load latest conversation')}
						</Button>
					)}
				</section>
				<aside className="inquiry-details" id={`inquiry-details-${inquiry._id}`} hidden={!detailsOpen}>
					<div className="chat-brief-heading">
						<h3>{translate('Original inquiry')}</h3>
						<Status value={inquiry.status} />
					</div>
					<dl>
						<dt>{translate('Project brief')}</dt>
						<dd className="prose-text">{inquiry.brief}</dd>
						<dt>{translate('Budget')}</dt>
						<dd>
							{inquiry.budgetMin != null || inquiry.budgetMax != null
								? `${inquiry.budgetMin != null ? money(inquiry.budgetMin) : 'Not specified'} – ${
										inquiry.budgetMax != null ? money(inquiry.budgetMax) : 'Not specified'
								  }`
								: translate('Not specified')}
						</dd>
						<dt>{translate('Submitted')}</dt>
						<dd>{date(inquiry.submittedAt)}</dd>
						<dt>{translate('Desired deadline')}</dt>
						<dd>{date(inquiry.desiredDeadline)}</dd>
						{inquiry.serviceSnapshot && (
							<>
								<dt>{translate('Selected service at submission')}</dt>
								<dd>
									<strong>{inquiry.serviceSnapshot.title}</strong>
									<p>
										{inquiry.serviceSnapshot.pricingType === 'STARTING_AT'
											? money(inquiry.serviceSnapshot.startingPrice)
											: translate('Custom quote')}
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
					{inquiry.outcome && (
						<p>
							{translate('Outcome:')} {label(inquiry.outcome)}
						</p>
					)}
					{active && (
						<div className="stack-actions">
							{inquiry.status === 'SENT' && (
								<Button secondary onClick={() => setFinish(isClient ? 'cancelInquiry' : 'declineInquiry')}>
									{isClient ? translate('Cancel inquiry') : translate('Decline inquiry')}
								</Button>
							)}
							{(isClient || inquiry.status === 'IN_DISCUSSION') && (
								<Button secondary onClick={() => setFinish('closeInquiry')}>
									{translate('Close inquiry')}
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
							? translate('Close inquiry')
							: finish === 'cancelInquiry'
							? translate('Cancel inquiry')
							: translate('Decline inquiry')}
						?
					</h2>
					{finish === 'closeInquiry' && (
						<Field label={translate('Outcome')}>
							<select value={outcome} onChange={(e) => setOutcome(e.target.value as InquiryOutcome)}>
								<option value="NOT_PROCEEDING">{translate('Not proceeding')}</option>
								{inquiry.status === 'IN_DISCUSSION' && (
									<option value="AGREED_TO_PROCEED">{translate('Agreed to proceed')}</option>
								)}
								{isClient &&
									inquiry.status === 'SENT' &&
									inquiry.submittedAt &&
									Date.now() - new Date(inquiry.submittedAt).getTime() >= 7 * 86400000 && (
										<option value="NO_RESPONSE">{translate('No response')}</option>
									)}
							</select>
						</Field>
					)}
					<p>{translate('You will not be able to send further messages.')}</p>
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
							{translate('Confirm')}
						</Button>
						<Button secondary onClick={() => setFinish(null)}>
							{translate('Keep open')}
						</Button>
					</div>
				</ConfirmationPrompt>
			)}
		</>
	);
}
