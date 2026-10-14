import { useMessagingRefresh } from '../../libs/messaging/MessagingProvider';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft, ChatsCircle, MagnifyingGlass } from 'phosphor-react';
import { useEffect, useRef, useState } from 'react';
import { userVar } from '../../apollo/store';
import { conversationTime, Empty, Picture, QueryState } from '../../libs/components/common/UI';
import { Conversation, StatusDot } from '../../libs/components/inquiry/InquiryConversation';
import { Draft } from '../../libs/components/inquiry/InquiryDraft';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useApi } from '../../libs/hooks/useApi';
import { useConversationList } from '../../libs/hooks/useInquiryHistory';
import { InquiryStatus } from '../../libs/types/creatorhub';

// Frontend filters over the conversations already loaded, as approved for Inbox v2.
type Filter = 'ALL' | 'ACTIVE' | 'CLOSED';

const filters: Record<Filter, InquiryStatus[] | null> = {
	ALL: null,
	ACTIVE: ['SENT', 'IN_DISCUSSION'],
	CLOSED: ['CLOSED', 'DECLINED', 'CANCELLED'],
};

export default function InquiryInbox() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Inbox')}>
			<Guard>
				<Inbox />
			</Guard>
		</Layout>
	);
}

export function Inbox({ selectedId = '' }: { selectedId?: string }) {
	const { t: translate, i18n } = useSiteTranslation('common');

	const user = useReactiveVar(userVar)!;
	const selected = useApi('getInquiry', { inquiryId: selectedId }, !selectedId);
	const result = useConversationList(user._id);
	const unread = useApi('getUnreadInquiryCount');
	useMessagingRefresh(
		(event) =>
			Boolean(selectedId) &&
			(event.type === 'sync' || (event.type === 'inbox' && event.change.inquiryId === selectedId)),
		() => selected.refetch(),
	);
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

	// Phones show an open conversation as a full-screen panel sized to the visible viewport,
	// so the input stays above the keyboard and the page behind it cannot scroll.
	useEffect(() => {
		if (!selectedId) return;
		const phone = window.matchMedia('(max-width: 700px)');
		const root = document.documentElement;
		const viewport = window.visualViewport;
		let lastHeight = 0;
		const update = () => {
			const height = viewport?.height ?? window.innerHeight;
			const list = document.querySelector<HTMLElement>('.messaging-inbox .message-list');
			const atBottom = list ? list.scrollHeight - list.scrollTop - list.clientHeight < 80 : false;
			root.classList.toggle('inbox-chat-open', phone.matches);
			root.style.setProperty('--inbox-chat-height', `${height}px`);
			root.style.setProperty('--inbox-chat-top', `${viewport?.offsetTop ?? 0}px`);
			// When the keyboard opens, keep the newest message in view above the input.
			if (list && atBottom && height < lastHeight)
				window.requestAnimationFrame(() => (list.scrollTop = list.scrollHeight));
			lastHeight = height;
		};
		update();
		phone.addEventListener('change', update);
		viewport?.addEventListener('resize', update);
		viewport?.addEventListener('scroll', update);
		return () => {
			phone.removeEventListener('change', update);
			viewport?.removeEventListener('resize', update);
			viewport?.removeEventListener('scroll', update);
			root.classList.remove('inbox-chat-open');
			root.style.removeProperty('--inbox-chat-height');
			root.style.removeProperty('--inbox-chat-top');
		};
	}, [selectedId]);

	// The list already holds the same fields as getInquiry, so open the chat from it at once
	// and swap in the fresh copy when it arrives (saves a round trip before messages load).
	const current = selected.value || result.rows.find((row) => row._id === selectedId);

	const [filter, setFilter] = useState<Filter>('ALL');
	const [search, setSearch] = useState('');
	const term = search.trim().toLowerCase();
	const rows = result.rows.filter((i) => {
		const statuses = filters[filter];
		if (statuses && !statuses.includes(i.status)) return false;
		return !term || `${i.counterpartyName || ''} ${i.subject || ''}`.toLowerCase().includes(term);
	});
	const filtered = rows.length !== result.rows.length;

	return (
		<div className={`messaging-inbox ${selectedId ? 'has-selection' : ''}`}>
			<div className="messaging-shell">
				<aside className="inbox-sidebar" aria-label={translate('Conversations')}>
					<div className="inbox-list-heading">
						<h1>{translate('Inbox')}</h1>
						{!!unread.value && <span>{translate('{{count}} unread', { count: unread.value })}</span>}
					</div>
					<label className="inbox-search">
						<MagnifyingGlass size={16} aria-hidden />
						<input
							type="search"
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							aria-label={translate('Search conversations')}
							placeholder={translate('Search by name or project')}
						/>
					</label>
					<div className="inbox-filters" role="group" aria-label={translate('Filter conversations')}>
						<button type="button" aria-pressed={filter === 'ALL'} onClick={() => setFilter('ALL')}>
							{translate('All')}
						</button>
						<button type="button" aria-pressed={filter === 'ACTIVE'} onClick={() => setFilter('ACTIVE')}>
							{translate('Active')}
						</button>
						<button type="button" aria-pressed={filter === 'CLOSED'} onClick={() => setFilter('CLOSED')}>
							{translate('Closed')}
						</button>
					</div>
					<div className="inbox-list-scroll" ref={listPane}>
						<QueryState loading={result.loading && !result.rows.length} error={result.error} retry={result.refresh} />
						<nav aria-label={translate('Conversations')}>
							{rows.map((i) => {
								return (
									<Link
										passHref
										key={i._id}
										href={`/inquiries/${i._id}`}
										aria-current={i._id === selectedId ? 'page' : undefined}
										className={`conversation-preview ${i._id === selectedId ? 'selected' : ''} ${
											i.unreadCount ? 'unread' : ''
										}`}
									>
										<span className="preview-avatar">
											<Picture avatar src={i.counterpartyAvatarUrl} alt="" sizes="40px" />
										</span>
										<div className="preview-copy">
											<div className="preview-top">
												<strong>{i.counterpartyName || translate('Member')}</strong>
												{i.unreadCount ? (
													<span
														className="preview-count"
														aria-label={translate('{{count}} unread', { count: i.unreadCount })}
													>
														{i.unreadCount > 99 ? '99+' : i.unreadCount}
													</span>
												) : (
													<time dateTime={i.updatedAt}>{conversationTime(i.updatedAt, i18n.language)}</time>
												)}
											</div>
											<p className="preview-subject">{i.subject || translate('Untitled draft')}</p>
										</div>
										<StatusDot status={i.status} />
									</Link>
								);
							})}
						</nav>
						{!result.loading &&
							!result.error &&
							!rows.length &&
							(filtered ? (
								<Empty title={translate('No conversations match your search')}>
									{translate('Try another name or project, or choose All.')}
								</Empty>
							) : (
								<Empty title={translate('No conversations yet')}>
									{translate('Find a creator and send an inquiry. Replies and received inquiries will appear here.')}
								</Empty>
							))}
						<div ref={moreSentinel} className="inbox-more-sentinel">
							<QueryState loading={result.loadingMore} />
						</div>
					</div>
					<p className="inbox-legend" aria-hidden>
						<span>
							<span className="inbox-dot new" />
							{translate('New')}
						</span>
						<span>
							<span className="inbox-dot discussing" />
							{translate('Discussing')}
						</span>
						<span>
							<span className="inbox-dot closed" />
							{translate('Closed')}
						</span>
					</p>
				</aside>
				<section className="inbox-conversation" aria-label={translate('Selected conversation')}>
					{selectedId ? (
						<>
							<QueryState
								loading={selected.loading && !current}
								error={current ? undefined : selected.error}
								retry={() => selected.refetch()}
							/>
							{current &&
								(current.status === 'DRAFT' ? (
									<div className="inbox-draft">
										<Link
											passHref
											className="mobile-inbox-back"
											href="/inquiries"
											aria-label={translate('Back to inbox')}
											title={translate('Back to inbox')}
										>
											<ArrowLeft size={22} aria-hidden />
										</Link>
										<Draft
											key={selectedId}
											inquiry={current}
											creatorId={current.creatorId}
											serviceId={current.serviceId || undefined}
											refresh={refresh}
										/>
									</div>
								) : (
									<Conversation
										key={selectedId}
										inquiry={current}
										isClient={current.clientId === user._id}
										refresh={refresh}
									/>
								))}
						</>
					) : (
						<div className="inbox-welcome">
							<ChatsCircle size={42} weight="light" aria-hidden="true" />
							<h2>{translate('Your conversations')}</h2>
							<p>{translate('Select an inquiry to read messages and reply.')}</p>
							<span>{translate('Project briefs and details stay with each conversation.')}</span>
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
