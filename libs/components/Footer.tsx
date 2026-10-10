import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { InstagramLogo, LinkedinLogo, TelegramLogo, YoutubeLogo } from 'phosphor-react';

export default function Footer() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<footer className="site-footer">
			<div className="footer-columns">
				<div className="footer-intro">
					<Link passHref href="/" className="brand-small">
						{' '}
						{translate('CreatorHub')}
					</Link>
					<p>{translate('Independent creativity. Connections across Korea.')}</p>
					<p>{translate('Discover creative work, meet the people behind it, and discuss your next project.')}</p>
				</div>
				<nav aria-label={translate('Explore')}>
					<h2>{translate('Explore')}</h2>
					<Link passHref href="/projects">
						{translate('Projects')}
					</Link>
					<Link passHref href="/creators">
						{translate('Creators')}
					</Link>
					<Link passHref href="/services">
						{translate('Services')}
					</Link>
					<Link passHref href="/events">
						{translate('Events')}
					</Link>
				</nav>
				<nav aria-label={translate('CreatorHub information')}>
					<h2> {translate('CreatorHub')}</h2>
					<Link passHref href="/about">
						{translate('About us')}
					</Link>
					<Link passHref href="/contact">
						{translate('Contact us')}
					</Link>
					<Link passHref href="/faq">
						{translate('FAQ')}
					</Link>
				</nav>
				<nav aria-label={translate('Your account and policies')}>
					<h2>{translate('Get started')}</h2>
					<Link passHref href="/account/register">
						{translate('Create an account')}
					</Link>
					<Link passHref href="/account/sign-in">
						{translate('Sign in')}
					</Link>
					<Link passHref href="/privacy">
						{translate('Privacy policy')}
					</Link>
					<Link passHref href="/terms">
						{translate('Terms of service')}
					</Link>
				</nav>
				<section className="footer-contact" aria-label={translate('Address and social accounts')}>
					<h2>{translate('Find us')}</h2>
					<address>{translate('Gwangju, Korea')}</address>
					<div className="footer-socials" role="group" aria-label={translate('Social media')}>
						{[
							{ name: 'Instagram', Icon: InstagramLogo },
							{ name: 'LinkedIn', Icon: LinkedinLogo },
							{ name: 'YouTube', Icon: YoutubeLogo },
							{ name: 'Telegram', Icon: TelegramLogo },
						].map(({ name, Icon }) => (
							<span key={name} className="footer-social-icon" role="img" aria-label={name}>
								<Icon size={22} aria-hidden="true" />
							</span>
						))}
					</div>
				</section>
			</div>
			<div className="footer-bottom">
				<span>
					© {new Date().getFullYear()} {translate('CreatorHub')}
				</span>
			</div>
		</footer>
	);
}
