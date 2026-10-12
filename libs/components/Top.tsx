import { useMessagingRefresh } from '../messaging/MessagingProvider';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import LanguageSelector from './LanguageSelector';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, EnvelopeSimple, List, SignOut } from 'phosphor-react';
import { useEffect, useRef } from 'react';
import useHeaderScroll from '../hooks/useHeaderScroll';
import { userVar } from '../../apollo/store';
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
	const profile = useApi('myCreatorProfile', {}, !user || user.role === 'USER');
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
	function accountContent() {
		if (!user) return null;
		return (
			<div>
				<div className="account-menu-identity">
					<strong>{user.displayName}</strong>
					<small>{translate('Signed in')}</small>
				</div>
				<Link href="/account" className="my-page-link">
					{translate('My page')}
				</Link>
				<div className="mobile-account-tools">
					<Link href="/inquiries">
						{translate('Inbox')} {inbox.value || ''}
					</Link>
					<Link href="/notifications">
						{translate('Notifications')} {count.value || ''}
					</Link>
				</div>
				{user.role !== 'ADMIN' && (
					<Link passHref href="/workspace">
						{translate('Workspace')}
					</Link>
				)}
				<Link passHref href="/account/settings">
					{translate('Account settings')}
				</Link>
				<Link passHref href="/saved">
					{translate('Saved projects')}
				</Link>
				{profile.value && (
					<Link passHref href={`/creators/${profile.value.slug}`}>
						{translate('My profile')}
					</Link>
				)}

				<Link passHref href="/following">
					{translate('Followers & Following')}
				</Link>
				{user.role === 'ADMIN' && (
					<Link passHref href="/_admin">
						{translate('Administration')}
					</Link>
				)}
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
						})
					}
				>
					<SignOut />
					{translate('Sign out')}
				</Button>
			</div>
		);
	}

	return (
		<>
			<div
				ref={header}
				className={`site-header ${compact ? 'is-compact' : ''} ${showNavigation ? 'has-navigation' : 'is-simple'}`}
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
						<details className="mobile-navigation" ref={mobileMenu}>
							<summary aria-label={translate('Main navigation')}>
								<List size={24} />
							</summary>
							<nav aria-label={translate('Main navigation')}>
								{navigation.map(([href, text]) => (
									<Link
										key={href}
										href={href}
										aria-current={
											router.pathname === href || router.pathname.startsWith(href + '/') ? 'page' : undefined
										}
									>
										{translate(text)}
									</Link>
								))}
								{!user && (
									<>
										{compact && <Link href={authHref}>{translate(authLabel)}</Link>}
										{!signingIn && !registering && <Link href="/account/register">{translate('Sign up')}</Link>}
									</>
								)}
								{user && <div className="mobile-account-links">{accountContent()}</div>}
								<LanguageSelector />
							</nav>
						</details>
						<LanguageSelector />
						{!user && (
							<Link href={authHref} className="mobile-login-link">
								{translate(authLabel)}
							</Link>
						)}
						{user ? (
							<>
								<Link
									passHref
									href="/inquiries"
									className="header-text-link"
									aria-label={`Inbox, ${inbox.value || 0} unread conversations`}
								>
									<EnvelopeSimple size={23} />
									<span>{translate('Inbox')}</span>
									{!!inbox.value && <span className="inbox-badge">{inbox.value > 99 ? '99+' : inbox.value}</span>}
								</Link>
								<Link
									passHref
									href="/notifications"
									className="icon-button"
									aria-label={`Notifications, ${count.value || 0} unread`}
								>
									<Bell size={23} />
									{!!count.value && <span className="dot" />}
								</Link>
								<details className="user-menu" ref={accountMenu}>
									<summary aria-label={`${translate('Account menu')}: ${user.displayName}`}>
										<Picture avatar src={user.avatarUrl} alt={user.displayName} />
										<span>{user.displayName}</span>
									</summary>
									{accountContent()}
								</details>
							</>
						) : (
							<>
								<div className="desktop-auth-actions">
									{!signingIn && <LinkButton href="/account/sign-in">{translate('Sign in')}</LinkButton>}
									{!registering && <LinkButton href="/account/register">{translate('Sign up')}</LinkButton>}
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
