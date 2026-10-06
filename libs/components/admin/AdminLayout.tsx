import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
	ArrowSquareOut,
	Calendar,
	ChatCircle,
	Folder,
	Gear,
	House,
	List,
	SignOut,
	SquaresFour,
	Tag,
	UserCircle,
	Users,
	X,
} from 'phosphor-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { sessionReadyVar, userVar } from '../../../apollo/store';
import { clearSession } from '../../auth';
import { useAction } from '../../hooks/useApi';
import { LinkButton, Notice, Picture } from '../common/UI';
export const adminLinks = [
	['/_admin', 'Overview', House],
	['/_admin/users', 'Users', Users],
	['/_admin/creators', 'Creators', UserCircle],
	['/_admin/projects', 'Projects', Folder],
	['/_admin/services', 'Services', SquaresFour],
	['/_admin/categories', 'Categories', Tag],
	['/_admin/events', 'Events', Calendar],
	['/_admin/moderation', 'Content approval', ChatCircle],
	['/_admin/comments', 'Comments', ChatCircle],
	['/_admin/content', 'Website content', Gear],
] as const;

export default function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
	const { t: translate } = useSiteTranslation('common');

	const user = useReactiveVar(userVar),
		ready = useReactiveVar(sessionReadyVar),
		router = useRouter(),
		action = useAction();
	const [open, setOpen] = useState(false);
	const sidebarRef = useRef<HTMLElement>(null);
	useEffect(() => {
		if (!open) return;
		const previous = document.activeElement as HTMLElement;
		const sidebar = sidebarRef.current;
		const focusable = () =>
			Array.from(sidebar?.querySelectorAll<HTMLElement>('a,button') || []).filter(
				(element) => element.getClientRects().length && getComputedStyle(element).display !== 'none',
			);
		focusable()[1]?.focus();
		const trap = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false);
				return;
			}
			if (event.key !== 'Tab') return;
			const elements = focusable(),
				first = elements[0],
				last = elements[elements.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last?.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first?.focus();
			}
		};
		document.addEventListener('keydown', trap);
		return () => {
			document.removeEventListener('keydown', trap);
			previous?.focus();
		};
	}, [open]);
	return (
		<div className="admin-shell">
			<Head>
				<title>
					{translate(title)} {translate('| CreatorHub administration')}
				</title>
				<meta name="robots" content={translate('noindex,nofollow')} />
			</Head>
			<a className="skip" href="#admin-main">
				{translate('Skip to administration')}
			</a>
			{open && (
				<button className="admin-scrim" aria-label={translate('Close navigation')} onClick={() => setOpen(false)} />
			)}
			<aside
				ref={sidebarRef}
				className={`admin-sidebar ${open ? 'open' : ''}`}
				aria-label={translate('Administrator navigation')}
			>
				<div className="admin-brand">
					<Link passHref href="/_admin">
						{translate('CreatorHub')}
						<span>{translate('ADMINISTRATION')}</span>
					</Link>
					<button className="admin-close" aria-label={translate('Close navigation')} onClick={() => setOpen(false)}>
						<X size={24} />
					</button>
				</div>
				<span className="admin-nav-label">{translate('MANAGE')}</span>
				<nav aria-label={translate('Administration')}>
					{adminLinks.map(([href, label, Icon]) => (
						<Link
							passHref
							key={href}
							href={href}
							aria-current={router.pathname === href ? 'page' : undefined}
							onClick={() => setOpen(false)}
						>
							<Icon size={20} />
							<span>{translate(label)}</span>
						</Link>
					))}
				</nav>
				<div className="admin-sidebar-bottom">
					<Link passHref href="/">
						<ArrowSquareOut size={19} /> {translate('View website')}
					</Link>
					<p>{translate('Changes are saved to the connected CreatorHub backend.')}</p>
				</div>
			</aside>
			<div className="admin-workspace" {...(open ? { inert: '', 'aria-hidden': true as const } : {})}>
				<header className="admin-topbar">
					<div className="admin-topbar-title">
						<button
							className="admin-menu"
							aria-label={translate('Open administration navigation')}
							aria-expanded={open}
							onClick={() => setOpen(true)}
						>
							<List size={24} />
						</button>
						<span>{translate('Administration')}</span>
						<span className="admin-topbar-divider">/</span>
						<strong>{translate(title)}</strong>
					</div>
					{user && (
						<div className="admin-account">
							<Picture src={user.avatarUrl} alt="" avatar />
							<span>
								{user.displayName}
								<small>{user.role === 'ADMIN' ? translate('Administrator') : user.role}</small>
							</span>
							<button
								aria-label={translate('Sign out')}
								disabled={action.busy}
								onClick={() =>
									action.run(async () => {
										await action.mutate('logout');
										clearSession();
										await action.client.clearStore();
										await router.push('/account/sign-in');
									})
								}
							>
								<SignOut size={21} />
							</button>
						</div>
					)}
				</header>
				<main id="admin-main" className="admin-main">
					{!ready ? (
						<p role="status">{translate('Checking your session…')}</p>
					) : !user ? (
						<section className="admin-access">
							<h1>{translate('Administrator sign-in')}</h1>
							<p>{translate('Sign in with an administrator account to manage CreatorHub.')}</p>
							<LinkButton href={`/account/sign-in?returnTo=${encodeURIComponent(router.asPath)}`}>
								{translate('Sign in')}
							</LinkButton>
						</section>
					) : user.role !== 'ADMIN' ? (
						<Notice error>{translate('This page is available to administrators only.')}</Notice>
					) : (
						children
					)}
					{action.error && <Notice error>{action.error}</Notice>}
				</main>
			</div>
		</div>
	);
}
