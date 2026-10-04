import { useApolloClient, useReactiveVar } from '@apollo/client';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { ComponentType } from 'react';
import { ReactNode, useEffect } from 'react';
import { sessionReadyVar, userVar } from '../../../apollo/store';
import { clearSession, finishSessionCheck, readSession } from '../../auth';
import { documents } from '../../hooks/useApi';
import AdminLayout from '../admin/AdminLayout';
import { LinkButton, Notice } from '../common/UI';
import Footer from '../Footer';
import Top from '../Top';
import Sidebar from './Sidebar';

export function SessionBootstrap() {
	const client = useApolloClient();
	useEffect(() => {
		let active = true;
		(async () => {
			if (readSession()) {
				try {
					const result = await client.query({ query: documents.me, fetchPolicy: 'network-only' });
					if (active) userVar(result.data.me);
				} catch {
					if (active) clearSession();
				}
			}
			if (active) finishSessionCheck();
		})();
		return () => {
			active = false;
		};
	}, [client]);
	return null;
}

export default function Layout({
	children,
	title = 'CreatorHub',
	area,
}: {
	children: ReactNode;
	title?: string;
	area?: 'workspace' | 'account' | 'admin';
}) {
	if (area === 'admin') return <AdminLayout title={title}>{children}</AdminLayout>;

	return (
		<>
			<Head>
				<title>{title === 'CreatorHub' ? title : `${title} | CreatorHub`}</title>
				<meta
					name="description"
					content="Explore creative work, discover creators and services, and start a private project inquiry."
				/>
			</Head>
			<a href="#main" className="skip">
				Skip to content
			</a>
			<Top />
			<div className={area ? 'app-frame' : 'public-frame'}>
				{area && <Sidebar area={area} />}

				<main id="main" className={area ? 'workspace-main' : 'public-main'}>
					{children}
				</main>
			</div>
			<Footer />
		</>
	);
}

export function Guard({
	children,
	adminOnly = false,
	creatorOnly = false,
}: {
	children: ReactNode;
	adminOnly?: boolean;
	creatorOnly?: boolean;
}) {
	const user = useReactiveVar(userVar);
	const ready = useReactiveVar(sessionReadyVar);
	const router = useRouter();
	if (!ready) return <p role="status">Checking your session…</p>;
	if (!user)
		return (
			<section className="empty">
				<h1>Sign in to continue</h1>
				<p>Your workspace and conversations are private.</p>
				<LinkButton href={`/account/sign-in?returnTo=${encodeURIComponent(router.asPath)}`}>Sign in</LinkButton>
			</section>
		);
	if (adminOnly && user.role !== 'ADMIN') return <Notice error>This page is available to administrators only.</Notice>;
	if (creatorOnly && user.role !== 'CREATOR' && user.role !== 'ADMIN')
		return (
			<section className="empty">
				<h1>Get your creator profile approved first</h1>
				<p>Set up your profile and submit it for admin approval before adding projects or services.</p>
				<LinkButton href="/workspace/profile">Open creator profile</LinkButton>
			</section>
		);
	return <>{children}</>;
}

export function withLayoutBasic<P extends object>(Page: ComponentType<P>, title = 'CreatorHub') {
	function WithLayout(props: P) {
		return (
			<Layout title={title}>
				<Page {...props} />
			</Layout>
		);
	}
	WithLayout.displayName = `withLayoutBasic(${Page.displayName || Page.name || 'Page'})`;
	return WithLayout;
}
