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
	return (
		<footer className="site-footer">
			<div className="footer-columns">
				<div className="footer-intro">
					<Link passHref href="/" className="brand-small">
						CreatorHub
					</Link>
					<p>{'Independent creativity. Connections across Korea.'}</p>
					<p>Discover creative work, meet the people behind it, and discuss your next project.</p>
				</div>
				<nav aria-label="Explore">
					<h2>Explore</h2>
					<Link passHref href="/projects">
						Projects
					</Link>
					<Link passHref href="/creators">
						Creators
					</Link>
					<Link passHref href="/services">
						Services
					</Link>
					<Link passHref href="/events">
						Events
					</Link>
				</nav>
				<nav aria-label="CreatorHub information">
					<h2>CreatorHub</h2>
					<Link passHref href="/about">
						About us
					</Link>
					<Link passHref href="/contact">
						Contact us
					</Link>
					<Link passHref href="/help">
						Help
					</Link>
				</nav>
				<nav aria-label="Your account and policies">
					<h2>Get started</h2>
					<Link passHref href="/account/register">
						Create an account
					</Link>
					<Link passHref href="/account/sign-in">
						Sign in
					</Link>
					<Link passHref href="/privacy">
						Privacy
					</Link>
					<Link passHref href="/terms">
						Terms
					</Link>
				</nav>
				<section className="footer-contact" aria-label="Address and social accounts">
					<h2>Find us</h2>
					<address>Gwangju, Korea</address>
					<div className="footer-socials">
						{socials.map(([name, Icon]) => (
							<button
								type="button"
								key={name}
								aria-label={`${name} demo account`}
								onClick={() => toast.info(`${name} account coming soon.`)}
							>
								<Icon size={23} />
							</button>
						))}
					</div>
					<p className="muted">Demo icons · real accounts coming soon</p>
				</section>
			</div>
			<div className="footer-bottom">
				<span>© {new Date().getFullYear()} CreatorHub</span>
				<span>Preview accounts, portfolio studies, and demo events are fictional.</span>
			</div>
		</footer>
	);
}
