import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useApi } from '../../hooks/useApi';
import Layout from '../layout/LayoutBasic';
import { Heading, LinkButton, QueryState } from './UI';

export default function InfoPage({ kind }: { kind: 'help' | 'privacy' | 'terms' | 'not-found' | 'unavailable' }) {
	const { t: translate } = useSiteTranslation('common');

	const health = useApi('apiName', {}, kind !== 'help');
	const title = translate(
		kind === 'help'
			? 'How can we help?'
			: kind === 'privacy'
			? 'Privacy'
			: kind === 'terms'
			? 'Terms of service'
			: kind === 'not-found'
			? 'Page not found'
			: 'This page is unavailable',
	);
	return (
		<Layout title={title}>
			<div className="info-page">
				<Heading title={title} />
				{kind === 'help' ? (
					<>
						<p>{translate('Explore projects, find creators, and start a private inquiry about your work.')}</p>
						<details open>
							<summary>{translate('How do I contact a creator?')}</summary>
							<p>
								{translate(
									'Open their profile or service, choose Send inquiry, write your brief, and send it directly to their inbox.',
								)}
							</p>
						</details>
						<details>
							<summary>{translate('How do I publish my work?')}</summary>
							<p>
								{translate(
									'Create your profile in the workspace. Add a headline, city, and category, then publish. Projects need a category, description, cover image, and media. Services need a category, description, and deliverables.',
								)}
							</p>
						</details>
						<details>
							<summary>{translate('How do I upload project files?')}</summary>
							<p>
								{translate(
									'Use Upload cover image or Upload project files in the project editor. Images and videos must be 10 MB or smaller.',
								)}
							</p>
						</details>
						<details>
							<summary>{translate('How do I reset my password?')}</summary>
							<p>
								{translate(
									'Email accounts can request a reset link on the sign-in page. Phone-only accounts do not currently have an automated password recovery option.',
								)}
							</p>
						</details>
						<details>
							<summary>{translate('Connection status')}</summary>
							<QueryState loading={health.loading} error={health.error} retry={() => health.refetch()} />
							{health.value && (
								<p>
									{translate('Connected to')} {health.value}.
								</p>
							)}
						</details>
					</>
				) : kind === 'privacy' || kind === 'terms' ? (
					<>
						<p>
							{translate('This')} {kind === 'privacy' ? translate('privacy notice') : translate('terms document')}{' '}
							{translate('has not been finalized.')}
						</p>
						<p>
							{translate('The project owner needs to supply the approved')}{' '}
							{kind === 'privacy' ? translate('data handling and retention policy') : translate('terms')}{' '}
							{translate('before a public launch.')}
						</p>
					</>
				) : (
					<>
						<p>
							{kind === 'not-found'
								? translate('The page may have moved, or the address may be incorrect.')
								: translate('This content may be private, removed, or temporarily unavailable.')}
						</p>
						<LinkButton href="/">{translate('Back to explore')}</LinkButton>
					</>
				)}
			</div>
		</Layout>
	);
}
