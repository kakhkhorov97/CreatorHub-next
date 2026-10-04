import { ArrowLeft, ArrowRight } from 'phosphor-react';
import React, { ReactNode } from 'react';
import { label } from '../../utils/format';
import { ConfirmationPrompt } from './ConfirmationPrompt';
import { Button } from './Button';
import { Notice } from './Feedback';

export function Status({ value }: { value?: string | null }) {
	return <span className={`status ${value?.toLowerCase()}`}>{label(value)}</span>;
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
	if (error)
		return (
			<Notice error>
				{error.message}{' '}
				{retry && (
					<Button secondary onClick={retry}>
						Try again
					</Button>
				)}
			</Notice>
		);
	return loading ? (
		<div className="loading" role="status">
			<span />
			Loading…
		</div>
	) : null;
}

export function Pager({
	offset,
	next,
	previous,
	canNext,
	loading,
}: {
	offset: number;
	next: () => void;
	previous: () => void;
	canNext: boolean;
	loading: boolean;
}) {
	return (
		<nav className="pager" aria-label="Pagination">
			<Button
				secondary
				disabled={!offset || loading}
				onClick={() => {
					previous();
					window.scrollTo({ top: 0, behavior: 'auto' });
				}}
			>
				<ArrowLeft />
				Previous
			</Button>
			<Button
				secondary
				disabled={!canNext || loading}
				onClick={() => {
					next();
					window.scrollTo({ top: 0, behavior: 'auto' });
				}}
			>
				Next
				<ArrowRight />
			</Button>
		</nav>
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
	return (
		<ConfirmationPrompt onCancel={onCancel} busy={busy}>
			<h3>{title}</h3>
			<p>{children}</p>
			<div className="actions">
				<Button danger={danger} disabled={busy} onClick={onConfirm}>
					Confirm
				</Button>
				<Button secondary disabled={busy} onClick={onCancel}>
					Keep it
				</Button>
			</div>
		</ConfirmationPrompt>
	);
}
