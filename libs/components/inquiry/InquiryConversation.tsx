import { ConfirmationPrompt } from '../common/ConfirmationPrompt';
import { EngagementFeedback } from './ServiceFeedback';
import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { useAction } from '../../hooks/useApi';
import { useCreatorDirectory } from '../../hooks/useCreatorDirectory';
import { usePaged } from '../../hooks/usePaged';
import { Inquiry, InquiryOutcome } from '../../types/creatorhub';
import {
	Button,
	date,
	Feedback,
	Field,
	Heading,
	label,
	money,
	Notice,
	Pager,
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
	const inbox = usePaged('getInquiries', { creatorInbox: !isClient });
	const directory = useCreatorDirectory([inquiry.creatorId]);
	const creator = directory[inquiry.creatorId];
	const messages = usePaged('getInquiryMessages', { inquiryId: inquiry._id });
	const events = usePaged('getInquiryEvents', { inquiryId: inquiry._id });
	const user = useReactiveVar(userVar)!;
	const [body, setBody] = useState('');
	const [finish, setFinish] = useState<'cancelInquiry' | 'declineInquiry' | 'closeInquiry' | null>(null);
	const [outcome, setOutcome] = useState<InquiryOutcome>('NOT_PROCEEDING');
	const key = useRef<string | null>(null);
	const active = ['SENT', 'IN_DISCUSSION'].includes(inquiry.status);
	const input = { inquiryId: inquiry._id, expectedVersion: inquiry.version };
	useEffect(() => {
		const timer = setInterval(() => {
			refresh().catch(() => {});
			messages.refetch().catch(() => {});
			events.refetch().catch(() => {});
		}, 15000);
		return () => clearInterval(timer);
	}, [inquiry._id, messages.offset, events.offset]);
	return (
		<>
			<Heading title="Inbox" />
			<p className="inbox-intro">Have private conversations with creators about your projects.</p>
			<div className="conversation-layout">
				<aside className="conversation-inbox panel">
					<h2>Your conversations</h2>
					<Link passHref href={isClient ? '/inquiries' : '/inquiries?inbox=creator'}>
						View all inquiries
					</Link>
					<QueryState loading={inbox.loading} error={inbox.error} />
					{inbox.rows.map((row) => (
						<Link
							passHref
							className={`inbox-item ${row._id === inquiry._id ? 'active' : ''}`}
							key={row._id}
							href={`/inquiries/${row._id}`}
							aria-current={row._id === inquiry._id ? 'page' : undefined}
						>
							<strong>{row.subject || 'Untitled inquiry'}</strong>
							<span>{label(row.status)}</span>
							<time>{date(row.updatedAt)}</time>
						</Link>
					))}
					<Pager {...inbox} />
				</aside>
				<section className="conversation panel">
					<div className="conversation-heading">
						<Picture avatar src={creator?.identity.avatarUrl} alt={creator?.identity.displayName || 'Creator'} />
						<div>
							<h2>{inquiry.subject || 'Private inquiry'}</h2>
							<p>{creator?.identity.displayName || 'Private conversation'}</p>
						</div>
						<Status value={inquiry.status} />
					</div>
					<QueryState loading={messages.loading} error={messages.error} retry={() => messages.refetch()} />
					<div className="message-list">
						{messages.rows.map((m) => (
							<article key={m._id} className={`message ${m.senderId === user._id ? 'mine' : ''}`}>
								<div className="row">
									<strong>{m.senderId === user._id ? 'You' : isClient ? 'Creator' : 'Client'}</strong>
									<time>{date(m.createdAt)}</time>
								</div>
								<p>{m.body}</p>
								{m.readAt ? (
									<small>Read</small>
								) : (
									m.senderId !== user._id && (
										<Button
											secondary
											disabled={action.busy}
											onClick={() =>
												action.run(async () => {
													await action.mutate('markInquiryMessageRead', { messageId: m._id });
													await messages.refetch();
												})
											}
										>
											Mark as read
										</Button>
									)
								)}
							</article>
						))}
					</div>
					<Pager {...messages} />
					{active ? (
						<form
							className="message-form"
							onSubmit={(e) => {
								e.preventDefault();
								action.run(async () => {
									key.current ??= crypto.randomUUID();
									await action.mutate('sendInquiryMessage', {
										input: { ...input, clientMessageKey: key.current, body },
									});
									key.current = null;
									setBody('');
									await refresh();
									await messages.refetch();
									await events.refetch();
								});
							}}
						>
							<TextArea
								label="Message"
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
							<Button type="submit" disabled={action.busy}>
								Send
							</Button>
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
									await messages.refetch();
								})
							}
						>
							Load latest conversation
						</Button>
					)}
				</section>
				<aside className="panel inquiry-details">
					<h2>Original inquiry</h2>
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
					<details className="conversation-history">
						<summary>Conversation history</summary>
						<QueryState loading={events.loading} error={events.error} />
						{events.rows.map((e) => (
							<div className="timeline-event" key={e._id}>
								<small>{date(e.createdAt)}</small>
								<p>{label(e.type)}</p>
							</div>
						))}
						<Pager {...events} />
					</details>
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
									await events.refetch();
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
			<EngagementFeedback inquiry={inquiry} isClient={isClient} refresh={refresh} />
		</>
	);
}
