import { useMessaging, useMessagingEvents, useMessagingRefresh } from '../../messaging/MessagingProvider';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import { ConfirmationPrompt } from '../common/ConfirmationPrompt';
import { EngagementFeedback } from './ServiceFeedback';
import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Info } from 'phosphor-react';
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { useAction } from '../../hooks/useApi';
import { useCreatorDirectory } from '../../hooks/useCreatorDirectory';
import { useInquiryHistory } from '../../hooks/useInquiryHistory';
import { responsiveImage } from '../../utils/image';
import { useServiceDirectory } from '../../hooks/useServiceDirectory';
import { handleMessageKey } from '../../utils/messageKeyboard';
import { Inquiry, InquiryOutcome, InquiryStatus } from '../../types/creatorhub';
import {
	Button,
	date,
	dayKey,
	dayLabel,
	Feedback,
	Field,
	label,
	mediaUrl,
	money,
	Notice,
	Picture,
	QueryState,
	TextArea,
} from '../common/UI';

// New = waiting for the first reply, Discussing = under way, Closed = finished, declined or cancelled.
function tone(status: InquiryStatus) {
	if (status === 'DRAFT') return 'draft';
	if (status === 'SENT') return 'new';
	if (status === 'IN_DISCUSSION') return 'discussing';
	return 'closed';
}

const shortLabels: Record<string, string> = {
	draft: 'Draft',
	new: 'New',
	discussing: 'Discussing',
	closed: 'Closed',
};

export function StatusPill({ status, short = false }: { status: InquiryStatus; short?: boolean }) {
	const { t: translate } = useSiteTranslation('common');

	const kind = tone(status);
	return (
		<span className={`inbox-pill ${kind}`}>
			<span className="inbox-pill-dot" aria-hidden />
			{translate(short ? shortLabels[kind] : label(status))}
		</span>
	);
}

// Inbox list (option A): status as a coloured dot, with the word kept for screen readers and tooltips.
export function StatusDot({ status }: { status: InquiryStatus }) {
	const { t: translate } = useSiteTranslation('common');

	const kind = tone(status);
	const text = translate(shortLabels[kind]);
	return <span className={`inbox-dot ${kind}`} role="img" aria-label={text} title={text} />;
}

function DaySeparator({ value }: { value: string }) {
	const { t: translate, i18n } = useSiteTranslation('common');

	const day = dayLabel(value, i18n.language);
	return (
		<div className="chat-day">
			{day === 'today' ? translate('Today') : day === 'yesterday' ? translate('Yesterday') : day}
		</div>
	);
}

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
	const [pendingMessage, setPendingMessage] = useState<string | null>(null);
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
	}, [messages.rows.length, messages.rows[messages.rows.length - 1]?._id, pendingMessage]);
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
		if (event.type === 'conversation' && event.change.inquiryId === inquiry._id && event.change.message) {
			messages.append(event.change.message, event.change.version);
			if (event.change.message.clientMessageKey === key.current) setPendingMessage(null);
		}
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

	// The counterpart is the creator only when you are the client; a client has no public profile.
	const directory = useCreatorDirectory(isClient ? [inquiry.creatorId] : []);
	const creator = isClient ? directory[inquiry.creatorId] : undefined;
	const services = useServiceDirectory([inquiry.serviceId]);
	const cover = inquiry.serviceId ? mediaUrl(services[inquiry.serviceId]?.imageUrl) : undefined;
	const snapshot = inquiry.serviceSnapshot;
	const budget =
		inquiry.budgetMin != null || inquiry.budgetMax != null
			? `${inquiry.budgetMin != null ? money(inquiry.budgetMin) : translate('Not specified')} – ${
					inquiry.budgetMax != null ? money(inquiry.budgetMax) : translate('Not specified')
			  }`
			: translate('Not specified');
	const stop = inquiry.status === 'SENT' ? (isClient ? ('cancelInquiry' as const) : ('declineInquiry' as const)) : null;
	const canClose = active && (isClient || inquiry.status === 'IN_DISCUSSION');
	const time = (value: string) =>
		new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', minute: '2-digit' }).format(new Date(value));

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
							<p>
								<span className="chat-heading-subject">{inquiry.subject || translate('Private inquiry')}</span>
								{creator?.city && <span className="chat-heading-city">{translate(label(creator.city))}</span>}
								{creator && (
									<Link className="chat-heading-profile" href={`/creators/${creator.slug}`}>
										{translate('View profile')}
									</Link>
								)}
							</p>
							{messaging.state !== 'connected' && (
								<small role="status">{translate('Reconnecting to messages… Your draft is kept.')}</small>
							)}
						</div>
						<StatusPill status={inquiry.status} />
						<button
							type="button"
							className={`chat-details-toggle ${detailsOpen ? 'active' : ''}`}
							aria-expanded={detailsOpen}
							aria-controls={`inquiry-details-${inquiry._id}`}
							aria-label={translate('Project details')}
							title={translate('Project details')}
							onClick={() => setDetailsOpen(!detailsOpen)}
						>
							<Info size={18} aria-hidden />
						</button>
					</div>
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
						<article className="chat-brief" aria-label={translate('Original inquiry')}>
							{cover && (
								<img className="chat-brief-cover" {...responsiveImage(cover)} sizes="96px" alt="" loading="lazy" />
							)}
							<div className="chat-brief-copy">
								<span className="chat-brief-label">
									{translate('Project brief · sent {{date}}', { date: date(inquiry.submittedAt) })}
								</span>
								<h3>{inquiry.subject || translate('Private inquiry')}</h3>
								<p className="prose-text">{inquiry.brief}</p>
								<div className="chat-brief-chips">
									<span>
										{translate('Budget')} {budget}
									</span>
									<span>
										{translate('Deadline')} {date(inquiry.desiredDeadline)}
									</span>
								</div>
							</div>
						</article>
						{!messages.loading && !messages.error && !messages.rows.length && (
							<p className="chat-no-replies">
								{translate('No replies yet.')}{' '}
								{active ? translate('Start the conversation below.') : translate('This conversation is closed.')}
							</p>
						)}
						{messages.rows.map((m, index) => {
							const previous = messages.rows[index - 1];
							const mine = m.senderId === user._id;
							return (
								<Fragment key={m._id}>
									{(!previous || dayKey(previous.createdAt) !== dayKey(m.createdAt)) && (
										<DaySeparator value={m.createdAt} />
									)}
									<article className={`message ${mine ? 'mine' : ''}`}>
										<strong className="message-author">
											{mine ? translate('You') : inquiry.counterpartyName || translate('Member')}
										</strong>
										<p>{m.body}</p>
										<div className="message-meta">
											<time dateTime={m.createdAt}>{time(m.createdAt)}</time>
											{mine && <small>{m.readAt ? translate('Read') : translate('Sent')}</small>}
										</div>
									</article>
								</Fragment>
							);
						})}
						{pendingMessage && (
							<article className="message mine pending-message">
								<strong className="message-author">{translate('You')}</strong>
								<p>{pendingMessage}</p>
								<div className="message-meta">
									<small role="status">{translate('Sending…')}</small>
								</div>
							</article>
						)}
					</div>
					{active ? (
						<form
							className="message-form"
							onSubmit={(e) => {
								e.preventDefault();
								if (!body.trim() || messaging.state !== 'connected' || roomError) return;
								action.run(async () => {
									key.current ??= crypto.randomUUID();
									setPendingMessage(body.trim());
									followMessages.current = true;
									try {
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
									} finally {
										setPendingMessage(null);
									}
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
								className="chat-send"
								aria-label={action.busy ? translate('Sending…') : translate('Send message')}
								loading={action.busy}
								disabled={action.busy || !body.trim() || messaging.state !== 'connected' || !!roomError}
							>
								<ArrowRight size={20} aria-hidden />
							</Button>
							<small className="chat-key-hint" id={`message-hint-${inquiry._id}`}>
								{translate('Enter to send · Shift+Enter for a new line')}
							</small>
						</form>
					) : (
						<Notice>
							{translate('This conversation is')} {translate(label(inquiry.status)).toLowerCase()}.
							<Link
								className="back-link"
								href="/inquiries"
								aria-label={translate('Back to inbox')}
								title={translate('Back to inbox')}
							>
								<ArrowLeft size={22} aria-hidden />
							</Link>
						</Notice>
					)}
					<Feedback {...action} busyLabel="Sending…" />
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
				<aside
					className={`inquiry-details ${detailsOpen ? 'open' : ''}`}
					id={`inquiry-details-${inquiry._id}`}
					aria-label={translate('Project details')}
				>
					<div className="room-card">
						{cover && <img className="room-cover" {...responsiveImage(cover)} sizes="320px" alt="" loading="lazy" />}
						<div className="room-card-body">
							<span className="room-kind">{translate(snapshot ? 'Service' : 'Project details')}</span>
							<h3>{snapshot?.title || inquiry.subject || translate('Private inquiry')}</h3>
							{snapshot && (
								<div className="room-row">
									<span>{translate('Price')}</span>
									<b>
										{snapshot.pricingType === 'STARTING_AT' ? money(snapshot.startingPrice) : translate('Custom quote')}
									</b>
								</div>
							)}
							<div className="room-row">
								<span>{translate('Budget')}</span>
								<b>{budget}</b>
							</div>
							<div className="room-row">
								<span>{translate('Deadline')}</span>
								<b>{date(inquiry.desiredDeadline)}</b>
							</div>
							<div className="room-row">
								<span>{translate('Status')}</span>
								<StatusPill status={inquiry.status} />
							</div>
							{inquiry.outcome && (
								<div className="room-row">
									<span>{translate('Outcome:')}</span>
									<b>{translate(label(inquiry.outcome))}</b>
								</div>
							)}
							{!!snapshot?.deliverables.length && (
								<ul className="room-deliverables">
									{snapshot.deliverables.map((d) => (
										<li key={d}>{d}</li>
									))}
								</ul>
							)}
						</div>
					</div>
					{(stop || canClose) && (
						<div className="room-card room-next">
							<b>{translate('Next step')}</b>
							{stop && (
								<Button secondary onClick={() => setFinish(stop)}>
									{isClient ? translate('Cancel inquiry') : translate('Decline inquiry')}
								</Button>
							)}
							{canClose && (
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
