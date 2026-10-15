import { CaretDown, Check, X } from 'phosphor-react';
import { useTranslation } from 'next-i18next';
import { useEffect, useId, useRef, useState } from 'react';

export type SheetOption = { value: string; label: string };

/**
 * Phone version of a search select: a labelled trigger that opens a bottom sheet of options.
 * Category and Location both use it, so they look and behave the same.
 */
export default function OptionSheet({
	label,
	title,
	value = '',
	allLabel,
	options,
	loading = false,
	error = false,
	onRetry,
	onChange,
}: {
	label: string;
	title: string;
	value?: string;
	allLabel: string;
	options: SheetOption[];
	loading?: boolean;
	error?: boolean;
	onRetry?(): void;
	onChange(value: string): void;
}) {
	const { t } = useTranslation('common');
	const dialog = useRef<HTMLDialogElement>(null);
	const [open, setOpen] = useState(false);
	const titleId = useId();
	useEffect(() => {
		if (!open) return;
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => {
			document.body.style.overflow = previous;
		};
	}, [open]);
	const selected = options.find((option) => option.value === value);
	function choose(next: string) {
		onChange(next);
		dialog.current?.close();
	}
	return (
		<div className="mobile-option-sheet">
			<button
				type="button"
				className="option-sheet-trigger"
				aria-haspopup="dialog"
				aria-expanded={open}
				onClick={() => {
					dialog.current?.showModal();
					setOpen(true);
				}}
			>
				<span className="option-sheet-label">{label}</span>
				<span className="option-sheet-value">{selected?.label || allLabel}</span>
				<CaretDown size={16} aria-hidden />
			</button>
			<dialog
				ref={dialog}
				className="category-sheet"
				aria-labelledby={titleId}
				onClose={() => setOpen(false)}
				onClick={(event) => {
					if (event.target === dialog.current) dialog.current.close();
				}}
			>
				<div className="category-sheet-content">
					<header>
						<h2 id={titleId}>{title}</h2>
						<button
							type="button"
							className="icon-button"
							aria-label={t('Close')}
							onClick={() => dialog.current?.close()}
						>
							<X size={22} />
						</button>
					</header>
					<div className="category-sheet-options">
						<button type="button" aria-pressed={!value} onClick={() => choose('')}>
							<span>{allLabel}</span>
							{!value && <Check size={20} aria-hidden />}
						</button>
						{options.map((option) => (
							<button
								type="button"
								key={option.value}
								aria-pressed={option.value === value}
								onClick={() => choose(option.value)}
							>
								<span>{option.label}</span>
								{option.value === value && <Check size={20} aria-hidden />}
							</button>
						))}
						{loading && <p role="status">{t('Loading…')}</p>}
						{error && onRetry && (
							<button type="button" onClick={onRetry}>
								{t('Try again')}
							</button>
						)}
					</div>
				</div>
			</dialog>
		</div>
	);
}
