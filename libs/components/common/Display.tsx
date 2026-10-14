import { useTranslation as useSiteTranslation } from 'next-i18next';
import { ArrowLeft, ArrowRight } from 'phosphor-react';
import React, { ReactNode, useEffect, useRef } from 'react';
import { label } from '../../utils/format';
import { ConfirmationPrompt } from './ConfirmationPrompt';
import { Button } from './Button';
import { Notice } from './Feedback';

export function Status({ value }: { value?: string | null }) {
	const { t: translate } = useSiteTranslation('common');
	return <span className={`status ${value?.toLowerCase()}`}>{translate(label(value))}</span>;
}

export function Empty({ title = 'Nothing here yet', children }: { title?: string; children?: ReactNode }) {
	return (
		<div className="empty">
			<h2>{title}</h2>
			{children && <p>{children}</p>}
		</div>
	);
}

export function QueryState({
	loading,
	error,
	retry,
}: {
	loading: boolean;
	error?: { message: string };
	retry?: () => unknown;
}) {
	const { t: translate } = useSiteTranslation('common');

	if (error)
		return (
			<Notice error>
				{translate(error.message)}{' '}
				{retry && (
					<Button secondary onClick={retry}>
						{translate('Try again')}
					</Button>
				)}
			</Notice>
		);
	return loading ? (
		<div className="loading" role="status">
			<span className="loading-spinner" aria-hidden />
			<strong>{translate('Loading…')}</strong>
			<div className="loading-preview" aria-hidden>
				<i />
				<i />
				<i />
			</div>
		</div>
	) : null;
}

export function Pager({
	offset,
	next,
	previous,
	canNext,
	loading,
	checkingNext = false,
	noMoreResults = false,
	nextPageError = false,
}: {
	offset: number;
	next: () => void | boolean | Promise<void | boolean>;
	previous: () => void;
	canNext: boolean;
	loading: boolean;
	checkingNext?: boolean;
	noMoreResults?: boolean;
	nextPageError?: boolean;
}) {
	const { t: translate } = useSiteTranslation('common');

	const pager = useRef<HTMLElement>(null);
	const lastOffset = useRef(offset);
	const needsScroll = useRef(false);
	useEffect(() => {
		if (offset !== lastOffset.current) {
			lastOffset.current = offset;
			needsScroll.current = true;
		}
		if (loading || !needsScroll.current) return;
		needsScroll.current = false;
		const list = pager.current?.parentElement?.querySelector('.grid, .event-list');
		const headerHeight = document.querySelector('.site-header')?.getBoundingClientRect().height || 0;
		const top = list ? list.getBoundingClientRect().top + window.scrollY - headerHeight - 16 : 0;
		const root = document.documentElement;
		const behavior = root.style.scrollBehavior;
		root.style.scrollBehavior = 'auto';
		window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
		root.style.scrollBehavior = behavior;
	}, [offset, loading]);

	return (
		<>
			<nav ref={pager} className="pager" aria-label={translate('Pagination')}>
				<Button
					secondary
					disabled={!offset || loading}
					onClick={() => {
						previous();
					}}
				>
					<ArrowLeft />
					{translate('Previous')}
				</Button>
				<Button
					secondary
					disabled={!canNext || loading}
					onClick={async () => {
						await next();
					}}
				>
					{translate('Next')}
					<ArrowRight />
				</Button>
			</nav>
			{checkingNext && (
				<p className="pagination-notice" role="status">
					{translate('Checking for more results…')}
				</p>
			)}
			{noMoreResults && (
				<p className="pagination-notice" role="status">
					{translate('No more results')}
				</p>
			)}
			{nextPageError && (
				<p className="pagination-notice pagination-error" role="alert">
					{translate('Could not check the next page. Please try again.')}
				</p>
			)}
		</>
	);
}

export function Heading({ title, children }: { title: string; children?: ReactNode }) {
	return (
		<div className="page-heading">
			<h1>{title}</h1>
			{children}
		</div>
	);
}

export function Confirm({
	title,
	children,
	onConfirm,
	busy,
	onCancel,
	danger = true,
}: {
	title: string;
	children: ReactNode;
	onConfirm: () => void;
	onCancel: () => void;
	busy?: boolean;
	danger?: boolean;
}) {
	const { t: translate } = useSiteTranslation('common');

	return (
		<ConfirmationPrompt onCancel={onCancel} busy={busy}>
			<h3>{title}</h3>
			<p>{children}</p>
			<div className="actions">
				<Button danger={danger} disabled={busy} onClick={onConfirm}>
					{translate('Confirm')}
				</Button>
				<Button secondary disabled={busy} onClick={onCancel} data-autofocus>
					{translate('Keep it')}
				</Button>
			</div>
		</ConfirmationPrompt>
	);
}
