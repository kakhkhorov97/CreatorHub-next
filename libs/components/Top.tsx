import { toast } from 'sonner';
import { useMessagingRefresh } from '../messaging/MessagingProvider';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import LanguageSelector from './LanguageSelector';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
	Bell,
	EnvelopeSimple,
	List,
	SignOut,
	Users,
	BookmarkSimple,
	Folder,
	SquaresFour,
	CalendarBlank,
	ChatCircle,
	User,
	CaretRight,
	X,
	ChatCenteredText,
} from 'phosphor-react';
import { useEffect, useRef } from 'react';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { sessionHintVar, sessionReadyVar, userVar } from '../../apollo/store';
import { clearSession, readSession } from '../auth';
import { useAction, useApi } from '../hooks/useApi';
import { Button, LinkButton, Notice, Picture } from './common/UI';
const navigation = [
	['/projects', 'Projects'],
	['/creators', 'Creators'],
	['/services', 'Services'],
	['/events', 'Events'],
	['/contact', 'Contact us'],
];

export default function Top() {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const user = useReactiveVar(userVar);
	// A saved account, shown while the session check runs so the header does not flash
	// Sign in / Sign up. Bounded by sessionReadyVar: once the check is done without a
	// user, the signed-out header is the truth. Display only, never role-gated UI.
	const hint = useReactiveVar(sessionHintVar);
	const sessionReady = useReactiveVar(sessionReadyVar);
	const pending = !user && !sessionReady ? hint : null;
	const signedOut = !user && !pending;
	const signingIn = router.pathname === '/account/sign-in';
	const registering = router.pathname === '/account/register';
	const authHref = signingIn ? '/account/register' : '/account/sign-in';
	const authLabel = signingIn ? 'Sign up' : 'Sign in';
	const action = useAction();
	const count = useApi('getUnreadNotificationCount', {}, !user, 30000);
	const inbox = useApi('getUnreadInquiryCount', {}, !user);
	useMessagingRefresh(
		(event) => Boolean(user) && (event.type === 'sync' || event.type === 'inbox'),
		() => Promise.all([inbox.refetch(), count.refetch()]),
	);
	const categories = useApi('categories');
	const discovery =
		router.pathname === '/' ||
		['/projects', '/services', '/creators'].some(
			(path) => router.pathname === path || router.pathname.startsWith(path + '/'),
		);
	const showNavigation =
		discovery ||
		router.pathname === '/events' ||
		router.pathname.startsWith('/events/') ||
		router.pathname === '/contact';
	const accountMenu = useRef<HTMLDetailsElement>(null);
	const mobileMenu = useRef<HTMLDetailsElement>(null);
	useEffect(() => {
		const closeOutside = (event: PointerEvent) => {
			if (event.target instanceof Node && mobileMenu.current && !mobileMenu.current.contains(event.target))
				mobileMenu.current.open = false;
			if (event.target instanceof Node && !accountMenu.current?.contains(event.target) && accountMenu.current)
				accountMenu.current.open = false;
		};
		document.addEventListener('pointerdown', closeOutside);
		return () => document.removeEventListener('pointerdown', closeOutside);
	}, []);
	useEffect(() => {
		if (accountMenu.current) accountMenu.current.open = false;
		if (mobileMenu.current) mobileMenu.current.open = false;
	}, [router.asPath]);
	const { header, compact } = useHeaderScroll(router.pathname, router.asPath);
	function signOutButton() {
		return (
			<Button
				secondary
				className="signout-button"
				disabled={action.busy}
				onClick={() =>
					action.run(async () => {
						const sessionId = readSession()?.sessionId;
						await action.mutate('logout');
						clearSession(sessionId);
						await action.client.clearStore();
						await router.push('/');
						// Only after the server ended the session and the header shows the signed-out state.
						toast.success(translate('You’ve been signed out.'));
					})
				}
			>
				<SignOut aria-hidden />
				{translate('Sign out')}
			</Button>
		);
	}
	function menuLink(href: string, text: string, Icon: typeof Users, badge = 0, mobileOnly = false) {
		return (
			<Link
				href={href}
				className={`menu-row${mobileOnly ? ' menu-mobile-only' : ''}`}
				key={href}
				aria-current={router.asPath.split('#')[0] === href ? 'page' : undefined}
			>
				<Icon size={21} aria-hidden />
				<span>{translate(text)}</span>
				{badge > 0 ? (
					<span className="menu-count">{badge > 99 ? '99+' : badge}</span>
				) : (
					<CaretRight size={16} aria-hidden />
				)}
			</Link>
		);
	}
	function accountContent(mobile = false, avatar = true) {
		if (!user) return null;
		return (
			<div className="account-dropdown">
				<div className="account-menu-primary">
					<div className="account-menu-identity">
						<Picture avatar src={user.avatarUrl} alt="" />
						<div>
							<strong>{user.displayName}</strong>
							<small>{translate('Signed in')}</small>
						</div>
					</div>
					<div className="account-menu-shortcuts">
						<Link href="/account">{translate('My page')}</Link>
						<Link href={user.role === 'ADMIN' ? '/_admin' : '/workspace'}>
							{translate(user.role === 'ADMIN' ? 'Administration' : 'Workspace')}
						</Link>
					</div>
					{mobile && menuLink('/inquiries', 'Inbox', EnvelopeSimple, inbox.value || 0, true)}
					{avatar && menuLink('/notifications', 'Notifications', Bell, count.value || 0)}
					{menuLink('/following', 'Followers & Following', Users)}
				</div>
				{mobile && (
					<div className="menu-group menu-mobile-only">
						{menuLink('/projects', 'Projects', Folder)}
						{menuLink('/services', 'Services', SquaresFour)}
						{menuLink('/creators', 'Creators', User)}
					</div>
				)}
				<div className="menu-group">
					{menuLink('/saved', 'Saved projects', BookmarkSimple)}
					{mobile && menuLink('/events', 'Events', CalendarBlank, 0, true)}
					{mobile && menuLink('/contact', 'Contact us', ChatCircle, 0, true)}
				</div>
				{avatar && (
					<div className="menu-language">
						<LanguageSelector />
					</div>
				)}
				<div className="menu-footer">{signOutButton()}</div>
			</div>
		);
	}

	// Phone menu: one list for everything, with Workspace as its own row.
	function phoneMenu() {
		const notifications = count.value || 0;
		return (
			<div className="phone-menu">
				{user ? (
					<div className="phone-menu-identity">
						<Link href="/account" className="phone-menu-identity-main">
							<Picture avatar src={user.avatarUrl} alt="" sizes="48px" />
							<span className="phone-menu-identity-text">
								<strong>{user.displayName}</strong>
								<small>{translate('My page')}</small>
							</span>
						</Link>
						<Link href="/account/settings" className="phone-menu-settings">
							{translate('Settings')}
						</Link>
					</div>
				) : pending ? (
					<div className="phone-menu-identity" role="status">
						<Picture avatar src={pending.avatarUrl} alt="" />
						<span className="phone-menu-identity-text">
							<strong>{pending.displayName}</strong>
							<small>{translate('Checking your session…')}</small>
						</span>
					</div>
				) : (
					<div className="phone-menu-auth">
						<LinkButton href="/account/sign-in">{translate('Sign in')}</LinkButton>
						<LinkButton secondary href="/account/register">
							{translate('Sign up')}
						</LinkButton>
					</div>
				)}
				<div className="phone-menu-main">
					{[
						['/projects', 'Projects'],
						['/creators', 'Creators'],
						['/services', 'Services'],
						['/events', 'Events'],
					].map(([href, text]) => (
						<Link
							key={href}
							href={href}
							aria-current={router.pathname === href || router.pathname.startsWith(href + '/') ? 'page' : undefined}
						>
							{translate(text)}
							<CaretRight size={18} aria-hidden />
						</Link>
					))}
				</div>
				{user && (
					<Link href={user.role === 'ADMIN' ? '/_admin' : '/workspace'} className="phone-menu-workspace">
						<span className="phone-menu-workspace-icon" aria-hidden>
							<SquaresFour size={20} />
						</span>
						<span>
							<strong>{translate(user.role === 'ADMIN' ? 'Administration' : 'Workspace')}</strong>
							<small>{translate('Your projects, services and profile')}</small>
						</span>
						<CaretRight size={18} aria-hidden />
					</Link>
				)}
				<div className="phone-menu-links">
					{user && menuLink('/notifications', 'Notifications', Bell, notifications)}
					{user && menuLink('/saved', 'Saved projects', BookmarkSimple)}
					{user && menuLink('/following', 'Followers & Following', Users)}
					{menuLink('/contact', 'Contact us', ChatCircle)}
				</div>
				<div className="menu-language">
					<LanguageSelector variant="buttons" />
				</div>
				{user && <div className="menu-footer">{signOutButton()}</div>}
			</div>
		);
	}

	return (
		<>
			<div
				ref={header}
				className={`site-header ${compact ? 'is-compact' : ''} ${showNavigation ? 'has-navigation' : 'is-simple'}${
					router.pathname === '/' && !compact ? ' over-hero' : ''
				}`}
			>
				<header
					className="top"
					onKeyDown={(event) => {
						if (event.key === 'Escape' && mobileMenu.current?.open) {
							mobileMenu.current.open = false;
							mobileMenu.current.querySelector('summary')?.focus();
						}
						if (event.key === 'Escape' && accountMenu.current?.open) {
							accountMenu.current.open = false;
							accountMenu.current.querySelector('summary')?.focus();
						}
					}}
				>
					<Link passHref href="/" className="brand">
						{translate('CreatorHub')}
					</Link>
					{showNavigation && (
						<nav className="primary-nav" aria-label={translate('Main navigation')}>
							{navigation.map(([href, text]) => (
								<Link
									passHref
									key={href}
									href={href}
									className={router.pathname === href || router.pathname.startsWith(href + '/') ? 'active' : ''}
									aria-current={router.pathname === href || router.pathname.startsWith(href + '/') ? 'page' : undefined}
								>
									{translate(text)}
								</Link>
							))}
						</nav>
					)}
					<div className="header-actions">
						<details
							className="mobile-navigation"
							ref={mobileMenu}
							onToggle={(event) => {
								if (event.currentTarget.open && accountMenu.current) accountMenu.current.open = false;
							}}
						>
							<summary
								aria-label={
									user && count.value
										? `${translate('Main navigation')}, ${translate('{{count}} unread notifications', {
												count: count.value,
										  })}`
										: translate('Main navigation')
								}
							>
								<List size={22} />
								<X className="phone-menu-close" size={22} aria-hidden />
								{(user || pending) && <Picture avatar src={(user || pending)!.avatarUrl} alt="" />}
								{user && !!count.value && (
									<span className="phone-menu-badge" aria-hidden>
										{count.value > 99 ? '99+' : count.value}
									</span>
								)}
							</summary>
							<nav aria-label={translate('Main navigation')}>{phoneMenu()}</nav>
						</details>
						{signedOut && (
							<details className="guest-language-menu">
								<summary aria-label={translate('Website language')} title={translate('Website language')}>
									<span className="sr-only">{translate('Website language')}</span>
								</summary>
								<LanguageSelector />
							</details>
						)}
						{signedOut && (
							<Link href={authHref} className="mobile-login-link">
								{translate(authLabel)}
							</Link>
						)}
						{user ? (
							<>
								<Link
									passHref
									href="/inquiries"
									className="header-text-link header-messages"
									aria-label={
										inbox.value
											? `${translate('Messages')}, ${translate('{{count}} unread', { count: inbox.value })}`
											: translate('Messages')
									}
									title={translate('Messages')}
								>
									<ChatCenteredText size={24} aria-hidden />
									{!!inbox.value && <span className="inbox-badge">{inbox.value > 99 ? '99+' : inbox.value}</span>}
								</Link>
								<details
									className="user-menu"
									ref={accountMenu}
									onToggle={(event) => {
										if (event.currentTarget.open && mobileMenu.current) mobileMenu.current.open = false;
									}}
								>
									<summary aria-label={`${translate('Account menu')}: ${user.displayName}`}>
										<Picture avatar src={user.avatarUrl} alt={user.displayName} />
										<X className="account-menu-close" size={24} aria-hidden />
										<span>{user.displayName}</span>
									</summary>
									{accountContent(true)}
								</details>
							</>
						) : pending ? (
							<div className="user-menu-pending" role="status" aria-label={translate('Checking your session…')}>
								<Picture avatar src={pending.avatarUrl} alt="" />
								<span>{pending.displayName}</span>
							</div>
						) : (
							<>
								<div className="desktop-auth-actions">
									{!signingIn && <LinkButton href="/account/sign-in">{translate('Sign in')}</LinkButton>}
									{!registering && (
										<LinkButton secondary href="/account/register">
											{translate('Sign up')}
										</LinkButton>
									)}
								</div>
							</>
						)}
					</div>
				</header>

				{discovery && (
					<nav className="header-categories" aria-label={translate('Creative categories')}>
						{categories.value?.map((category) => (
							<Link passHref key={category._id} href={`/projects?categoryId=${category._id}`}>
								{translate(category.name)}
							</Link>
						))}
					</nav>
				)}
			</div>
			{action.error && <Notice error>{action.error}</Notice>}
		</>
	);
}
