import { useMessagingRefresh } from '../messaging/MessagingProvider';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import LanguageSelector from './LanguageSelector';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, EnvelopeSimple, MagnifyingGlass, SignOut } from 'phosphor-react';
import { useEffect, useRef, useState } from 'react';
import { userVar } from '../../apollo/store';
import { clearSession } from '../auth';
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
	useEffect(() => {
		const closeOutside = (event: PointerEvent) => {
			if (event.target instanceof Node && !accountMenu.current?.contains(event.target) && accountMenu.current)
				accountMenu.current.open = false;
		};
		document.addEventListener('pointerdown', closeOutside);
		return () => document.removeEventListener('pointerdown', closeOutside);
	}, []);
	useEffect(() => {
		if (accountMenu.current) accountMenu.current.open = false;
	}, [router.asPath]);
	const [compact, setCompact] = useState(false);
	useEffect(() => {
		let observer: IntersectionObserver | undefined;
		const target = router.pathname === '/' ? document.getElementById('homepage-search') : null;
		if (target) {
			observer = new IntersectionObserver(
				([entry]) => setCompact(!entry.isIntersecting && entry.boundingClientRect.bottom < 80),
				{ rootMargin: '-80px 0px 0px 0px' },
			);
			observer.observe(target);
		} else setCompact(router.pathname !== '/');
		return () => observer?.disconnect();
	}, [router.pathname]);
	return (
		<>
			<div className={`site-header ${compact ? 'is-compact' : ''} ${showNavigation ? 'has-navigation' : 'is-simple'}`}>
				<header
					className="top"
					onKeyDown={(event) => {
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
					{discovery && compact && (
						<form
							className="header-search"
							onSubmit={(event) => {
								event.preventDefault();
								const query = new FormData(event.currentTarget).get('query');
								router.push({ pathname: '/projects', query: { query: String(query || '') } });
							}}
						>
							<label className="sr-only" htmlFor="header-query">
								{translate('Search projects')}
							</label>
							<input id="header-query" name="query" maxLength={200} placeholder={translate('Search creative work…')} />
							<Button type="submit" aria-label={translate('Search projects')}>
								<MagnifyingGlass size={20} />
							</Button>
						</form>
					)}
					<div className="header-actions">
						<LanguageSelector />
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
									<summary aria-label={translate('Account menu')}>
										<Picture avatar src={user.avatarUrl} alt={user.displayName} />
										<span>{user.displayName}</span>
									</summary>
									<div>
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
													await action.mutate('logout');
													clearSession();
													await action.client.clearStore();
													await router.push('/');
												})
											}
										>
											<SignOut />
											{translate('Sign out')}
										</Button>
									</div>
								</details>
							</>
						) : (
							<>
								<div className="desktop-auth-actions">
									<LinkButton secondary href="/account/sign-in">
										{translate('Sign in')}
									</LinkButton>
									<LinkButton href="/account/register">{translate('Sign up')}</LinkButton>
								</div>
							</>
						)}
					</div>
				</header>
				{discovery && compact && (
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
