import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { koreaCopy } from '../../utils/korea';
import { Heading, LinkButton } from './UI';

export default function CompanyPage({ contact = false }: { contact?: boolean }) {
	const { t: translate } = useSiteTranslation('common');

	const site = useApi('getSiteContent');
	return (
		<>
			<div className="company-page">
				<div className="company-heading">
					<Heading title={contact ? translate('Let’s start a conversation.') : translate('Creativity connects us.')} />
					<p className="muted">
						{contact
							? translate('Find the right way to reach a creator or get help with CreatorHub.')
							: translate('Independent work. People with ideas. Connections across Korea.')}
					</p>
				</div>
				{contact ? (
					<div className="company-body">
						<section>
							<h2>{translate('Have a project in mind?')}</h2>
							<p>
								{translate(
									'Contact a creator directly from their profile or service page. Sign in, prepare your project brief, and send a private inquiry. Your conversation stays in your inbox.',
								)}
							</p>
							<LinkButton href="/creators">{translate('Find a creator')}</LinkButton>
						</section>
						<section>
							<h2>{translate('Need help using CreatorHub?')}</h2>
							<p>
								{translate('Read our help page for guidance on accounts, publishing your work, and sending inquiries.')}
							</p>
							<Link passHref href="/help">
								{translate('Visit the help page →')}
							</Link>
						</section>
						<section>
							<h2>{translate('Contact the CreatorHub team')}</h2>
							<p>
								{translate(
									koreaCopy(
										site.value?.contactText ||
											'Find us in Gwangju, Korea. Our public contact details will be added soon.',
									),
								)}
							</p>
							{site.value?.contactEmail && <a href={`mailto:${site.value.contactEmail}`}>{site.value.contactEmail}</a>}
						</section>
					</div>
				) : (
					<div className="company-body">
						<section>
							<h2>{translate('A place for independent creativity')}</h2>
							{(
								koreaCopy(
									site.value?.aboutText ||
										'CreatorHub brings portfolios, creator profiles, and creative services together across Korea.',
								) || 'CreatorHub brings portfolios, creator profiles, and creative services together.'
							)
								.split(/\n\s*\n/)
								.map((paragraph, i) => (
									<p key={i}>{translate(paragraph)}</p>
								))}
						</section>
						<section>
							<h2>{translate('From discovery to conversation')}</h2>
							<p>
								{translate(
									'Browse published projects, explore creative disciplines, and find a service that fits your brief. Save work for later, follow creators, and discuss your project through a private inquiry.',
								)}
							</p>
						</section>
						<section>
							<h2>{translate('A space for your work')}</h2>
							<p>
								{translate(
									'Creators can build a profile, publish portfolio projects, and describe their services. Your workspace keeps your work and inquiries together.',
								)}
							</p>
							<LinkButton href="/account/register">{translate('Join CreatorHub')}</LinkButton>
						</section>
						<section>
							<h2>{translate('About this preview')}</h2>
							<p>
								{translate(
									'The sample creators, portfolio studies, and events in this preview are fictional. Their AI-generated images illustrate how the platform can look with published content.',
								)}
							</p>
							<Link passHref href="/contact">
								{translate('Contact us →')}
							</Link>
						</section>
					</div>
				)}
			</div>
		</>
	);
}
