import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useApolloClient, useReactiveVar } from '@apollo/client';
import Seo from '../common/Seo';
import type { PageMetadata } from '../../seo/metadata';
import { useRouter } from 'next/router';
import type { ComponentType } from 'react';
import { ReactNode, useEffect } from 'react';
import { sessionReadyVar, userVar } from '../../../apollo/store';
import { clearSession, finishSessionCheck, isAuthenticationError, readSession, watchSharedSession } from '../../auth';
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
		const stopWatching = watchSharedSession();
		(async () => {
			const session = readSession();
			if (session) {
				try {
					const result = await client.query({ query: documents.me, fetchPolicy: 'network-only' });
					if (active && readSession()?.sessionId === session.sessionId) userVar(result.data.me);
				} catch (error) {
					// Temporary startup failures must not erase a recoverable session.
					if (active && readSession()?.refreshToken === session.refreshToken && isAuthenticationError(error))
						clearSession();
				}
			}
			if (active) finishSessionCheck();
		})();
		return () => {
			active = false;
			stopWatching();
		};
	}, [client]);
	return null;
}

export default function Layout({
	children,
	title = 'CreatorHub',
	area,
	seo,
}: {
	children: ReactNode;
	title?: string;
	area?: 'workspace' | 'account' | 'admin';
	seo?: PageMetadata;
}) {
	const { t: translate } = useSiteTranslation('common');

	if (area === 'admin') return <AdminLayout title={title}>{children}</AdminLayout>;

	return (
		<>
			<Seo
				title={translate(title)}
				description={translate(
					'Explore creative work, discover creators and services, and start a private project inquiry.',
				)}
				{...seo}
			/>
			<a href="#main" className="skip">
				{translate('Skip to content')}
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
	const { t: translate } = useSiteTranslation('common');

	const user = useReactiveVar(userVar);
	const ready = useReactiveVar(sessionReadyVar);
	const router = useRouter();
	if (!ready) return <p role="status">{translate('Checking your session…')}</p>;
	if (!user)
		return (
			<section className="empty">
				<h1>{translate('Sign in to continue')}</h1>
				<p>{translate('Your workspace and conversations are private.')}</p>
				<LinkButton href={`/account/sign-in?returnTo=${encodeURIComponent(router.asPath)}`}>
					{translate('Sign in')}
				</LinkButton>
			</section>
		);
	if (adminOnly && user.role !== 'ADMIN')
		return <Notice error>{translate('This page is available to administrators only.')}</Notice>;
	if (creatorOnly && user.role !== 'CREATOR' && user.role !== 'ADMIN')
		return (
			<section className="empty">
				<h1>{translate('Get your creator profile approved first')}</h1>
				<p>{translate('Set up your profile and submit it for admin approval before adding projects or services.')}</p>
				<LinkButton href="/workspace/profile">{translate('Open creator profile')}</LinkButton>
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
