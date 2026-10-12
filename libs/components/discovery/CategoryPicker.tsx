import { CaretDown, Check, X } from 'phosphor-react';
import { useTranslation } from 'next-i18next';
import { useEffect, useId, useRef, useState } from 'react';
import { useApi } from '../../hooks/useApi';

export default function CategoryPicker({
	value = '',
	onChange,
	name,
}: {
	value?: string;
	onChange(value: string): void;
	name?: string;
}) {
	const { t } = useTranslation('common');
	const categories = useApi('categories');
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
	const selected = categories.value?.find((category) => category._id === value);
	function choose(id: string) {
		onChange(id);
		dialog.current?.close();
	}
	return (
		<div className="mobile-category-picker">
			{name && <input type="hidden" name={name} value={value} />}
			<button
				type="button"
				className="category-picker-trigger"
				aria-haspopup="dialog"
				aria-expanded={open}
				onClick={() => {
					dialog.current?.showModal();
					setOpen(true);
				}}
			>
				<span>{t(selected?.name || 'All categories')}</span>
				<CaretDown size={18} aria-hidden />
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
						<h2 id={titleId}>{t('Choose a category')}</h2>
						<button
							type="button"
							className="icon-button"
							aria-label={t('Close categories')}
							onClick={() => dialog.current?.close()}
						>
							<X size={22} />
						</button>
					</header>
					<div className="category-sheet-options">
						<button type="button" aria-pressed={!value} onClick={() => choose('')}>
							<span>{t('All categories')}</span>
							{!value && <Check size={20} aria-hidden />}
						</button>
						{categories.value?.map((category) => (
							<button
								type="button"
								key={category._id}
								aria-pressed={category._id === value}
								onClick={() => choose(category._id)}
							>
								<span>{t(category.name)}</span>
								{category._id === value && <Check size={20} aria-hidden />}
							</button>
						))}
						{categories.loading && <p role="status">{t('Loading…')}</p>}
						{categories.error && (
							<button type="button" onClick={() => categories.refetch()}>
								{t('Try again')}
							</button>
						)}
					</div>
				</div>
			</dialog>
		</div>
	);
}
