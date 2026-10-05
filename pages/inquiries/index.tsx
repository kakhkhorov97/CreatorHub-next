import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { ChatsCircle } from 'phosphor-react';
import { useEffect, useRef } from 'react';
import { userVar } from '../../apollo/store';
import { date, Empty, Picture, QueryState, Status } from '../../libs/components/common/UI';
import { Conversation } from '../../libs/components/inquiry/InquiryConversation';
import { Draft } from '../../libs/components/inquiry/InquiryDraft';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useApi } from '../../libs/hooks/useApi';
import { useConversationList } from '../../libs/hooks/useInquiryHistory';

export default function InquiryInbox() {
	return (
		<Layout title="Inbox">
			<Guard>
				<Inbox />
			</Guard>
		</Layout>
	);
}

export function Inbox({ selectedId = '' }: { selectedId?: string }) {
	const user = useReactiveVar(userVar)!;
	const selected = useApi('getInquiry', { inquiryId: selectedId }, !selectedId);
	const result = useConversationList(user._id);
	const listPane = useRef<HTMLDivElement>(null);
	const moreSentinel = useRef<HTMLDivElement>(null);
	const { hasMore, loadingMore, error, loadMore } = result;
	useEffect(() => {
		if (!hasMore || loadingMore || error || !moreSentinel.current) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) loadMore();
			},
			{ root: listPane.current, rootMargin: '120px' },
		);
		observer.observe(moreSentinel.current);
		return () => observer.disconnect();
	}, [hasMore, loadingMore, error, loadMore]);
	const refresh = async () => {
		await selected.refetch();
		await result.refresh();
	};
	return (
		<div className={`messaging-inbox ${selectedId ? 'has-selection' : ''}`}>
			<header className="inbox-page-heading">
				<h1>Inbox</h1>
				<p>Your project conversations</p>
			</header>
			<div className="messaging-shell">
				<aside className="inbox-sidebar" aria-label="Conversations">
					<div className="inbox-list-heading">
						<h2>Messages</h2>
						<span>{result.total} conversations</span>
					</div>
					<div className="inbox-list-scroll" ref={listPane}>
						<QueryState loading={result.loading && !result.rows.length} error={result.error} retry={result.refresh} />
						{result.rows.map((i) => (
							<Link
								passHref
								key={i._id}
								href={`/inquiries/${i._id}`}
								aria-current={i._id === selectedId ? 'page' : undefined}
								className={`conversation-preview ${i._id === selectedId ? 'selected' : ''} ${
									i.unreadCount ? 'unread' : ''
								}`}
							>
								<Picture avatar src={i.counterpartyAvatarUrl} alt="" />
								<div className="preview-copy">
									<div className="preview-top">
										<strong>{i.counterpartyName || 'Member'}</strong>
										<time dateTime={i.updatedAt}>{date(i.updatedAt)}</time>
									</div>
									<p className="preview-subject">{i.subject || 'Untitled draft'}</p>
									<p className="preview-brief">{i.brief || 'Continue writing your inquiry.'}</p>
									<div className="preview-meta">
										<span>{i.clientId === user._id ? 'You contacted them' : 'They contacted you'}</span>
										<Status value={i.status} />
										{!!i.unreadCount && <span className="preview-unread" aria-label="Unread conversation" />}
									</div>
								</div>
							</Link>
						))}
						{!result.loading && !result.error && !result.rows.length && (
							<Empty title="No conversations yet">
								Find a creator and send an inquiry. Replies and received inquiries will appear here.
							</Empty>
						)}
						<div ref={moreSentinel} className="inbox-more-sentinel">
							<QueryState loading={result.loadingMore} />
						</div>
					</div>
				</aside>
				<section className="inbox-conversation" aria-label="Selected conversation">
					{selectedId ? (
						<>
							<QueryState
								loading={selected.loading && !selected.value}
								error={selected.error}
								retry={() => selected.refetch()}
							/>
							{selected.value &&
								(selected.value.status === 'DRAFT' ? (
									<div className="inbox-draft">
										<Link passHref className="mobile-inbox-back" href="/inquiries">
											Back to inbox
										</Link>
										<Draft
											key={selectedId}
											inquiry={selected.value}
											creatorId={selected.value.creatorId}
											serviceId={selected.value.serviceId || undefined}
											refresh={refresh}
										/>
									</div>
								) : (
									<Conversation
										key={selectedId}
										inquiry={selected.value}
										isClient={selected.value.clientId === user._id}
										refresh={refresh}
									/>
								))}
						</>
					) : (
						<div className="inbox-welcome">
							<ChatsCircle size={42} weight="light" aria-hidden="true" />
							<h2>Your conversations</h2>
							<p>Select an inquiry to read messages and reply.</p>
							<span>Project briefs and details stay with each conversation.</span>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
