import { useApi } from '../../hooks/useApi';
import Layout from '../layout/LayoutBasic';
import { Heading, LinkButton, QueryState } from './UI';

export default function InfoPage({ kind }: { kind: 'help' | 'privacy' | 'terms' | 'not-found' | 'unavailable' }) {
	const health = useApi('apiName', {}, kind !== 'help');
	const title =
		kind === 'help'
			? 'How can we help?'
			: kind === 'privacy'
			? 'Privacy'
			: kind === 'terms'
			? 'Terms of service'
			: kind === 'not-found'
			? 'Page not found'
			: 'This page is unavailable';
	return (
		<Layout title={title}>
			<div className="info-page">
				<Heading title={title} />
				{kind === 'help' ? (
					<>
						<p>Explore projects, find creators, and start a private inquiry about your work.</p>
						<details open>
							<summary>How do I contact a creator?</summary>
							<p>
								Open their profile or service, choose Send inquiry, write your brief, and send it directly to their
								inbox.
							</p>
						</details>
						<details>
							<summary>How do I publish my work?</summary>
							<p>
								Create your profile in the workspace. Add a headline, city, and category, then publish. Projects need a
								category, description, cover image, and media. Services need a category, description, and deliverables.
							</p>
						</details>
						<details>
							<summary>Why can’t I upload images?</summary>
							<p>
								Direct uploads are not available yet. The project editor accepts media URLs from your account storage
								folder.
							</p>
						</details>
						<details>
							<summary>How do I reset my password?</summary>
							<p>
								Email accounts can request a reset link on the sign-in page. Phone-only accounts do not currently have
								an automated password recovery option.
							</p>
						</details>
						<details>
							<summary>Connection status</summary>
							<QueryState loading={health.loading} error={health.error} retry={() => health.refetch()} />
							{health.value && <p>Connected to {health.value}.</p>}
						</details>
					</>
				) : kind === 'privacy' || kind === 'terms' ? (
					<>
						<p>This {kind === 'privacy' ? 'privacy notice' : 'terms document'} has not been finalized.</p>
						<p>
							The project owner needs to supply the approved{' '}
							{kind === 'privacy' ? 'data handling and retention policy' : 'terms'} before a public launch.
						</p>
					</>
				) : (
					<>
						<p>
							{kind === 'not-found'
								? 'The page may have moved, or the address may be incorrect.'
								: 'This content may be private, removed, or temporarily unavailable.'}
						</p>
						<LinkButton href="/">Back to explore</LinkButton>
					</>
				)}
			</div>
		</Layout>
	);
}
