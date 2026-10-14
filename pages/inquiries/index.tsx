import { useMessagingRefresh } from '../../libs/messaging/MessagingProvider';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { ArrowLeft, ChatsCircle, MagnifyingGlass } from 'phosphor-react';
import { useEffect, useRef, useState } from 'react';
import { userVar } from '../../apollo/store';
import { conversationTime, Empty, mediaUrl, Picture, QueryState } from '../../libs/components/common/UI';
import { Conversation, StatusPill } from '../../libs/components/inquiry/InquiryConversation';
import { Draft } from '../../libs/components/inquiry/InquiryDraft';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useApi } from '../../libs/hooks/useApi';
import { useConversationList } from '../../libs/hooks/useInquiryHistory';
import { useServiceDirectory } from '../../libs/hooks/useServiceDirectory';
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

	const [filter, setFilter] = useState<Filter>('ALL');
	const [search, setSearch] = useState('');
	const services = useServiceDirectory(result.rows.map((i) => i.serviceId));
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
								const service = i.serviceId ? mediaUrl(services[i.serviceId]?.imageUrl) : undefined;
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
											<Picture avatar src={i.counterpartyAvatarUrl} alt="" />
											{service && <img className="preview-service" src={service} alt="" loading="lazy" />}
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
											<div className="preview-meta">
												<p className="preview-brief">{i.brief || translate('Continue writing your inquiry.')}</p>
												<StatusPill status={i.status} short />
											</div>
										</div>
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
				</aside>
				<section className="inbox-conversation" aria-label={translate('Selected conversation')}>
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
