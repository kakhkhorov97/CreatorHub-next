import { useTranslation as useSiteTranslation } from 'next-i18next';
import Layout from '../layout/LayoutBasic';
import { Heading, LinkButton } from './UI';

const faq = [
	[
		'What can I do on CreatorHub?',
		'Browse published projects, discover creators and explore their services. Create an account to save work, follow creators and start private project conversations. CreatorHub does not handle payments or bookings.',
	],
	[
		'How do I create an account?',
		'Choose Sign up, enter your name, email and contact phone number, and confirm your password. Verify your email before protected actions. Sign in with email only; your phone number is contact information. Social sign-in is not available yet.',
	],
	[
		'How do I become a creator?',
		'Use your workspace to create a creator profile on your existing account. Add your headline, location, categories and skills, then submit it for administrator approval. You do not need a second account.',
	],
	[
		'How do I publish my work?',
		'Add a project with its category, description, cover image and gallery. Submit it for administrator approval from your workspace. Pending edits keep the previous approved public version visible; rejected submissions show a reason.',
	],
	[
		'What is the difference between a project and a service?',
		'A project showcases your portfolio work. A service describes work you offer, its deliverables and either a starting price in KRW or a custom quote. Service publication also requires approval.',
	],
	[
		'How do I upload project files?',
		'Upload JPEG, PNG or WebP images and MP4 or WebM gallery videos from the project editor. Each file must be 10 MB or smaller, with up to ten files per upload and twenty gallery items per project. Uploaded media is publicly accessible through its URL.',
	],
	[
		'How do I contact a creator?',
		'Open a creator profile or service and choose Send inquiry. Describe your project, optionally select a service, budget or deadline, then send. You cannot inquire about your own work. The original brief appears directly in the conversation.',
	],
	[
		'Where do inquiry alerts appear?',
		'New inquiries and replies appear in your Inbox and its unread badge. They do not appear in Notifications. Notifications is reserved for activity such as follows, project likes, comments and newly published work.',
	],
	[
		'Who can read my conversations?',
		'Only the client and the creator taking part in an inquiry can read its conversation. Administrator status alone does not grant access to private inquiries. Messages remain available in the conversation history.',
	],
	[
		'How do likes, saved projects and follows work?',
		'Press the heart once to like a project and again to remove your like. Save projects to your private Saved list. Follow creators to keep up with their work, and use Followers & Following in your account menu to view your connections.',
	],
	[
		'How can the AI assistant help?',
		'Open Ask CreatorHub AI for help finding public creators, projects and services or understanding website workflows. Guests can use it too. Answers may be incomplete, so check linked results and avoid sharing sensitive information. It cannot access private conversations or make account changes.',
	],
	[
		'How do I change the website language?',
		'Use the globe icon to choose English, Korean or Uzbek. On mobile, signed-in members can also find language options in the account menu.',
	],
	[
		'How do I reset my password?',
		'Email accounts can request a reset link on the sign-in page. Phone-only accounts do not currently have an automated password recovery option.',
	],
	[
		'Are all profiles, projects and events real?',
		'The catalog includes clearly disclosed fictional creator profiles, concept projects and AI-generated artwork. Fictional event concepts are not scheduled events and do not accept registration. Check individual descriptions before treating any listing as a real commission or event.',
	],
];

export default function InfoPage({ kind }: { kind: 'help' | 'privacy' | 'terms' | 'not-found' | 'unavailable' }) {
	const { t: translate } = useSiteTranslation('common');

	const title = translate(
		kind === 'help'
			? 'FAQ'
			: kind === 'privacy'
			? 'Privacy policy'
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
						<p>{translate('Answers to common questions about accounts, creative work and private conversations.')}</p>
						{faq.map(([question, answer], index) => (
							<details key={question} open={index === 0}>
								<summary>{translate(question)}</summary>
								<p>{translate(answer)}</p>
							</details>
						))}
						<LinkButton href="/creators">{translate('Find a creator')}</LinkButton>
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
