import { useMessagingRefresh } from '../messaging/MessagingProvider';
import { useApolloClient } from '@apollo/client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Inquiry, InquiryMessage, Operations } from '../types/creatorhub';
import { documents } from './useApi';

function unique<T extends { _id: string }>(rows: T[]) {
	return Array.from(new Map(rows.map((row) => [row._id, row])).values());
}

export function useConversationList(userId: string) {
	const client = useApolloClient();
	const [rows, setRows] = useState<Inquiry[]>([]);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [error, setError] = useState<Error>();
	const pages = useRef(1);
	const moreBusy = useRef(false);
	const refreshBusy = useRef(false);
	const refreshPending = useRef(false);
	const request = useCallback(
		async (page: number) => {
			const result = await client.query<{ getInquiries: Operations['getInquiries']['result'] }>({
				query: documents.getInquiries,
				variables: { allConversations: true, input: { page, limit: 20 } },
				fetchPolicy: 'network-only',
			});
			return result.data.getInquiries;
		},
		[client, userId],
	);

	const refresh = useCallback(async (): Promise<void> => {
		if (refreshBusy.current || moreBusy.current) {
			refreshPending.current = true;
			return;
		}
		refreshBusy.current = true;
		try {
			const loaded: Inquiry[] = [];
			let count = 0;
			for (let page = 1; page <= pages.current; page++) {
				const result = await request(page);
				loaded.push(...result.list);
				count = result.metaCounter[0]?.total || 0;
			}
			setRows(unique(loaded));
			setTotal(count);
			setError(undefined);
		} catch (cause) {
			setError(cause instanceof Error ? cause : new Error('Could not load conversations.'));
		} finally {
			setLoading(false);
			refreshBusy.current = false;
			if (refreshPending.current) {
				refreshPending.current = false;
				void refresh();
			}
		}
	}, [request]);

	const loadMore = useCallback(async () => {
		if (moreBusy.current || refreshBusy.current || rows.length >= total) return;
		moreBusy.current = true;
		setLoadingMore(true);
		try {
			const result = await request(pages.current + 1);
			pages.current++;
			setRows((previous) => unique([...previous, ...result.list]));
			setTotal(result.metaCounter[0]?.total || 0);
			setError(undefined);
		} catch (cause) {
			setError(cause instanceof Error ? cause : new Error('Could not load more conversations.'));
		} finally {
			moreBusy.current = false;
			setLoadingMore(false);
			if (refreshPending.current) {
				refreshPending.current = false;
				void refresh();
			}
		}
	}, [request, rows.length, total]);

	useEffect(() => {
		pages.current = 1;
		refresh();
	}, [refresh]);

	useMessagingRefresh((event) => event.type === 'sync' || event.type === 'inbox', refresh);
	return { rows, total, loading, loadingMore, error, refresh, loadMore, hasMore: rows.length < total };
}

export function useInquiryHistory(inquiryId: string, version: number) {
	const client = useApolloClient();
	const [rows, setRows] = useState<InquiryMessage[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingOlder, setLoadingOlder] = useState(false);
	const [hasOlder, setHasOlder] = useState(false);
	const [observedVersion, setObservedVersion] = useState(-1);
	const observedVersionRef = useRef(-1);
	const [error, setError] = useState<Error>();
	const lowestPage = useRef(0);
	const highestPage = useRef(0);
	const olderBusy = useRef(false);
	const latestRequest = useRef(0);
	const merge = (messages: InquiryMessage[]) =>
		unique(messages).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a._id.localeCompare(b._id));
	const request = useCallback(
		async (page: number) => {
			const result = await client.query<{ getInquiryMessages: Operations['getInquiryMessages']['result'] }>({
				query: documents.getInquiryMessages,
				variables: { inquiryId, input: { page, limit: 50 } },
				fetchPolicy: 'network-only',
			});
			return result.data.getInquiryMessages;
		},
		[client, inquiryId],
	);

	const refresh = useCallback(
		async (reloadLoaded = false) => {
			const sequence = ++latestRequest.current;
			try {
				const fromPage = reloadLoaded ? lowestPage.current || 1 : highestPage.current || 1;
				const initial = await request(fromPage);
				const lastPage = Math.max(1, Math.ceil((initial.metaCounter[0]?.total || 0) / 50));
				let messages = [...initial.list];
				if (!highestPage.current && lastPage > 1) {
					messages = (await request(lastPage)).list;
				} else {
					for (let page = fromPage + 1; highestPage.current && page <= lastPage; page++) {
						messages.push(...(await request(page)).list);
					}
				}
				if (sequence !== latestRequest.current) return;
				if (!lowestPage.current) lowestPage.current = lastPage;
				highestPage.current = lastPage;
				setRows((previous) => merge([...previous, ...messages]));
				setHasOlder(lowestPage.current > 1);
				observedVersionRef.current = Math.max(observedVersionRef.current, version);
				setObservedVersion(observedVersionRef.current);
				setError(undefined);
			} catch (cause) {
				if (sequence === latestRequest.current)
					setError(cause instanceof Error ? cause : new Error('Could not load messages.'));
			} finally {
				if (sequence === latestRequest.current) setLoading(false);
			}
		},
		[request, version],
	);

	const loadOlder = useCallback(async () => {
		if (olderBusy.current || lowestPage.current <= 1) return;
		olderBusy.current = true;
		setLoadingOlder(true);
		try {
			const page = lowestPage.current - 1;
			const result = await request(page);
			lowestPage.current = page;
			setRows((previous) => merge([...result.list, ...previous]));
			setHasOlder(page > 1);
			setError(undefined);
		} catch (cause) {
			setError(cause instanceof Error ? cause : new Error('Could not load older messages.'));
		} finally {
			olderBusy.current = false;
			setLoadingOlder(false);
		}
	}, [request]);

	useEffect(() => {
		if (observedVersionRef.current < version) void refresh();
	}, [refresh, version]);
	const append = useCallback((message: InquiryMessage, observed: number) => {
		setRows((previous) => merge([...previous, message]));
		observedVersionRef.current = Math.max(observedVersionRef.current, observed);
		setObservedVersion(observedVersionRef.current);
	}, []);
	return { append, rows, loading, loadingOlder, hasOlder, observedVersion, error, refresh, loadOlder };
}
