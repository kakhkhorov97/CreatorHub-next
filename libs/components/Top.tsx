import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, BookmarkSimple, EnvelopeSimple, MagnifyingGlass, SignOut } from 'phosphor-react';
import { useEffect, useState } from 'react';
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
	const categories = useApi('categories');
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
			{' '}
			<div className={`site-header ${compact ? 'is-compact' : ''}`}>
				<header className="top">
					<Link passHref href="/" className="brand">
						CreatorHub
					</Link>
					{compact && (
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
					<div className="header-actions">
						{user ? (
							<>
								<Link passHref href="/saved" className="header-text-link" aria-label="Saved projects">
									<BookmarkSimple size={23} />
									<span>Saved</span>
								</Link>
								<Link passHref href="/inquiries" className="header-text-link" aria-label="Inbox">
									<EnvelopeSimple size={23} />
									<span>Inbox</span>
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
								<details className="user-menu">
									<summary>
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
										{user.role === 'ADMIN' && (
											<Link passHref href="/_admin">
												Administration
											</Link>
										)}
										<Button
											secondary
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
				{compact && (
					<nav className="header-categories" aria-label="Creative categories">
						{categories.value?.map((category) => (
							<Link passHref key={category._id} href={`/projects?categoryId=${category._id}`}>
								{category.name}
							</Link>
						))}
					</nav>
				)}
			</div>
			{action.error && <Notice error>{action.error}</Notice>}
		</>
	);
}
