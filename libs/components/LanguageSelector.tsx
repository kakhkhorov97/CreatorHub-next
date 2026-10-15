import { useRouter } from 'next/router';
import { useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { CaretDown, Check, Globe } from 'phosphor-react';
import LanguageFlag from './LanguageFlag';

const languages = [
	{ locale: 'en', name: 'English' },
	{ locale: 'ko', name: '한국어' },
	{ locale: 'uz', name: 'O‘zbekcha' },
];
// Short names for the phone menu button row.
const shortNames: Record<string, string> = { en: 'English', ko: '한국어', uz: 'O‘zbek' };

// 'compact' is the navbar button: a globe and the current language code (EN / KO / UZ).
export default function LanguageSelector({ variant = 'dropdown' }: { variant?: 'dropdown' | 'buttons' | 'compact' }) {
	const router = useRouter();
	const { t } = useTranslation('common');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState(false);
	const [open, setOpen] = useState(false);
	const container = useRef<HTMLDivElement>(null);
	const trigger = useRef<HTMLButtonElement>(null);
	const options = useRef<Array<HTMLButtonElement | null>>([]);
	const menuId = useId();
	const current = languages.find((language) => language.locale === router.locale) || languages[0];

	useEffect(() => {
		if (open) options.current[languages.indexOf(current)]?.focus();
	}, [open, current]);

	useEffect(() => {
		const closeOutside = (event: PointerEvent) => {
			if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
		};
		document.addEventListener('pointerdown', closeOutside);
		return () => document.removeEventListener('pointerdown', closeOutside);
	}, []);

	useEffect(() => setOpen(false), [router.asPath]);

	async function chooseLanguage(locale: string) {
		if (busy) return;
		setOpen(false);
		trigger.current?.focus();
		if (locale === current.locale) return;
		setBusy(true);
		setError(false);
		try {
			const changed = await router.push({ pathname: router.pathname, query: router.query }, router.asPath, {
				locale,
				scroll: false,
			});
			if (changed) document.cookie = `NEXT_LOCALE=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
		} catch {
			setError(true);
		} finally {
			setBusy(false);
		}
	}

	if (variant === 'buttons') {
		return (
			<div className="language-selector language-buttons">
				<div role="group" aria-label={t('Website language')}>
					{languages.map((language) => (
						<button
							key={language.locale}
							type="button"
							lang={language.locale}
							aria-pressed={language.locale === current.locale}
							aria-busy={busy}
							disabled={busy}
							onClick={() => chooseLanguage(language.locale)}
						>
							{shortNames[language.locale]}
						</button>
					))}
				</div>
				{error && (
					<span className="language-error" role="alert">
						{t('Could not change language. Try again.')}
					</span>
				)}
			</div>
		);
	}

	return (
		<div
			className={`language-selector${variant === 'compact' ? ' language-compact' : ''}`}
			ref={container}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
			}}
			onKeyDown={(event) => {
				if (event.key === 'Escape' && open) {
					event.preventDefault();
					setOpen(false);
					trigger.current?.focus();
				}
			}}
		>
			<button
				ref={trigger}
				type="button"
				className="language-trigger"
				aria-label={`${t('Website language')}: ${current.name}`}
				aria-haspopup="menu"
				aria-expanded={open}
				aria-controls={open ? menuId : undefined}
				aria-busy={busy}
				disabled={busy}
				onClick={() => setOpen(!open)}
				onKeyDown={(event) => {
					if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
						event.preventDefault();
						setOpen(true);
					}
				}}
			>
				{variant === 'compact' ? (
					<>
						<Globe size={16} aria-hidden="true" />
						<span aria-hidden="true">{current.locale.toUpperCase()}</span>
					</>
				) : (
					<>
						<LanguageFlag locale={current.locale} />
						<span lang={current.locale}>{current.name}</span>
						<CaretDown size={12} aria-hidden="true" />
					</>
				)}
			</button>
			{open && (
				<div id={menuId} className="language-menu" role="menu" aria-label={t('Website language')}>
					{languages.map((language, index) => (
						<button
							key={language.locale}
							ref={(element) => (options.current[index] = element)}
							type="button"
							role="menuitemradio"
							tabIndex={-1}
							aria-checked={language.locale === current.locale}
							lang={language.locale}
							onClick={() => chooseLanguage(language.locale)}
							onKeyDown={(event) => {
								if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
								event.preventDefault();
								const next =
									event.key === 'Home'
										? 0
										: event.key === 'End'
										? languages.length - 1
										: (index + (event.key === 'ArrowDown' ? 1 : -1) + languages.length) % languages.length;
								options.current[next]?.focus();
							}}
						>
							<span className="language-choice">
								<LanguageFlag locale={language.locale} />
								<span>{language.name}</span>
							</span>
							{language.locale === current.locale && <Check size={17} weight="bold" aria-hidden="true" />}
						</button>
					))}
				</div>
			)}
			{error && (
				<span className="language-error" role="alert">
					{t('Could not change language. Try again.')}
				</span>
			)}
		</div>
	);
}
