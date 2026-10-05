import { useReactiveVar } from '@apollo/client';
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
	const router = useRouter();
	const user = useReactiveVar(userVar);
	const action = useAction();
	const count = useApi('getUnreadNotificationCount', {}, !user, 30000);
	const inbox = useApi('getUnreadInquiryCount', {}, !user, 15000);
	const categories = useApi('categories');
	const discovery =
		router.pathname === '/' ||
		['/projects', '/services', '/creators'].some(
			(path) => router.pathname === path || router.pathname.startsWith(path + '/'),
		);
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
	const [pendingEmail, setPendingEmail] = useState('');
	useEffect(() => {
		setPendingEmail(sessionStorage.getItem('creatorhub.pendingEmail') || '');
	}, [router.asPath, user]);
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
			<div className={`site-header ${compact ? 'is-compact' : ''} ${!discovery ? 'is-simple' : ''}`}>
				<header className="top">
					<Link passHref href="/" className="brand">
						CreatorHub
					</Link>
					{discovery && (
						<nav className="primary-nav" aria-label="Main navigation">
							{navigation.map(([href, text]) => (
								<Link
									passHref
									key={href}
									href={href}
									className={router.pathname === href || router.pathname.startsWith(href + '/') ? 'active' : ''}
									aria-current={router.pathname === href || router.pathname.startsWith(href + '/') ? 'page' : undefined}
								>
									{text}
								</Link>
							))}
						</nav>
					)}
					{discovery && compact && (
						<form className="header-search" action="/projects">
							<label className="sr-only" htmlFor="header-query">
								Search projects
							</label>
							<input id="header-query" name="query" maxLength={200} placeholder="Search creative work…" />
							<Button type="submit" aria-label="Search projects">
								<MagnifyingGlass size={20} />
							</Button>
						</form>
					)}
					<div className="header-actions">
						{user ? (
							<>
								<Link
									passHref
									href="/inquiries"
									className="header-text-link"
									aria-label={`Inbox, ${inbox.value || 0} unread conversations`}
								>
									<EnvelopeSimple size={23} />
									<span>Inbox</span>
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
									<summary aria-label="Account menu">
										<Picture avatar src={user.avatarUrl} alt={user.displayName} />
										<span>{user.displayName}</span>
									</summary>
									<div>
										<Link passHref href="/workspace">
											Workspace
										</Link>
										<Link passHref href="/account/settings">
											Account settings
										</Link>
										<Link passHref href="/saved">
											Saved projects
										</Link>
										{profile.value && (
											<Link passHref href={`/creators/${profile.value.slug}`}>
												My profile
											</Link>
										)}
										<Link passHref href="/inquiries">
											Inquiries
										</Link>
										<Link passHref href="/following">
											Following
										</Link>
										{user.role === 'ADMIN' && (
											<Link passHref href="/_admin">
												Administration
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
											Sign out
										</Button>
									</div>
								</details>
							</>
						) : (
							<>
								<LinkButton secondary href="/account/sign-in">
									Sign in
								</LinkButton>
								<LinkButton href="/account/register">Sign up</LinkButton>
							</>
						)}
					</div>
				</header>
				{discovery && compact && (
					<nav className="header-categories" aria-label="Creative categories">
						{categories.value?.map((category) => (
							<Link passHref key={category._id} href={`/projects?categoryId=${category._id}`}>
								{category.name}
							</Link>
						))}
					</nav>
				)}
			</div>
			{!user && pendingEmail && (
				<Notice>
					Account created. Verify the email sent to {pendingEmail} before signing in.{' '}
					<Link href="/account/verify-email">Verify email or resend</Link>
				</Notice>
			)}
			{action.error && <Notice error>{action.error}</Notice>}
		</>
	);
}
