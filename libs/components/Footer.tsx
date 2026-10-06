import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { InstagramLogo, LinkedinLogo, TwitterLogo, YoutubeLogo } from 'phosphor-react';
import { toast } from 'sonner';
const socials = [
	['Instagram', InstagramLogo],
	['YouTube', YoutubeLogo],
	['LinkedIn', LinkedinLogo],
	['X', TwitterLogo],
] as const;

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
					<Link passHref href="/help">
						{translate('Help')}
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
						{translate('Privacy')}
					</Link>
					<Link passHref href="/terms">
						{translate('Terms')}
					</Link>
				</nav>
				<section className="footer-contact" aria-label={translate('Address and social accounts')}>
					<h2>{translate('Find us')}</h2>
					<address>{translate('Gwangju, Korea')}</address>
					<div className="footer-socials">
						{socials.map(([name, Icon]) => (
							<button
								type="button"
								key={name}
								aria-label={translate('{{name}} demo account', { name })}
								onClick={() => toast.info(translate('{{name}} account coming soon.', { name }))}
							>
								<Icon size={23} />
							</button>
						))}
					</div>
					<p className="muted">{translate('Demo icons · real accounts coming soon')}</p>
				</section>
			</div>
			<div className="footer-bottom">
				<span>
					© {new Date().getFullYear()} {translate('CreatorHub')}
				</span>
				<span>{translate('Preview accounts, portfolio studies, and demo events are fictional.')}</span>
			</div>
		</footer>
	);
}
