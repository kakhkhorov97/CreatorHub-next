import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { userVar } from '../../../apollo/store';
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
	['/account', 'My page', User],
	['/following?tab=followers', 'Followers', Users],
	['/following?tab=following', 'Following', Users],
	['/account/settings', 'Account settings', Gear],
	['/account/sign-in-methods', 'Sign-in methods', Gear],
	['/saved', 'Saved projects', BookmarkSimple],
	['/notifications', 'Notifications', Bell],
	['/workspace', 'Workspace', House],
] as const;

export default function Sidebar({ area }: { area: 'workspace' | 'account' }) {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const user = useReactiveVar(userVar);
	const links =
		area === 'workspace' ? workspace : account.filter(([href]) => user?.role !== 'ADMIN' || href !== '/workspace');
	return (
		<aside className="sidebar">
			<nav aria-label={translate('Your account')}>
				{links.map(([href, text, Icon]) => (
					<Link
						passHref
						key={href}
						href={href}
						className={
							router.asPath.split('#')[0] === href ||
							(href === '/following?tab=following' && router.pathname === '/following' && !router.query.tab) ||
							(area === 'workspace' && href !== '/workspace' && router.pathname.startsWith(href + '/'))
								? 'active'
								: ''
						}
					>
						<Icon size={21} />
						{translate(text)}
					</Link>
				))}
			</nav>
		</aside>
	);
}
