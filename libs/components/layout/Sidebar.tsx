import Link from 'next/link';
import { useRouter } from 'next/router';
import { Bell, BookmarkSimple, EnvelopeSimple, Folder, Gear, House, SquaresFour, User, Users } from 'phosphor-react';
const workspace = [
	['/workspace', 'Overview', House],
	['/workspace/profile', 'Creator profile', User],
	['/workspace/projects', 'Projects', Folder],
	['/workspace/services', 'Services', SquaresFour],
	['/inquiries', 'Inquiries', EnvelopeSimple],
	['/account/settings', 'Settings', Gear],
] as const;
const account = [
	['/account/settings', 'Account', User],
	['/account/sign-in-methods', 'Sign-in methods', Gear],
	['/saved', 'Saved projects', BookmarkSimple],
	['/following', 'Following', Users],
	['/notifications', 'Notifications', Bell],
	['/workspace', 'Workspace', House],
] as const;

export default function Sidebar({ area }: { area: 'workspace' | 'account' }) {
	const router = useRouter();
	const links = area === 'workspace' ? workspace : account;
	return (
		<aside className="sidebar">
			<nav aria-label="Your account">
				{links.map(([href, text, Icon]) => (
					<Link
						passHref
						key={href}
						href={href}
						className={
							router.pathname === href || (href !== '/workspace' && router.pathname.startsWith(href + '/'))
								? 'active'
								: ''
						}
					>
						<Icon size={21} />
						{text}
					</Link>
				))}
			</nav>
		</aside>
	);
}
