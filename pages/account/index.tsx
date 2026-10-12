import Link from 'next/link';
import { useReactiveVar } from '@apollo/client';
import { useTranslation } from 'next-i18next';
import { CaretRight } from 'phosphor-react';
import { userVar } from '../../apollo/store';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { Picture } from '../../libs/components/common/UI';

export default function MyPage() {
	const { t } = useTranslation('common');
	return (
		<Layout title={t('My page')} area="account">
			<Guard>
				<AccountOverview />
			</Guard>
		</Layout>
	);
}

function AccountOverview() {
	const { t } = useTranslation('common');
	const user = useReactiveVar(userVar)!;
	return (
		<div className="my-page">
			<h1>{t('My page')}</h1>
			<p className="muted">{t('Your account, saved work and connections.')}</p>
			<section className="account-overview-identity" aria-label={t('Your profile')}>
				<Picture avatar src={user.avatarUrl} alt="" />
				<div>
					<h2>{user.displayName}</h2>
					<p>{t('Signed in')}</p>
				</div>
			</section>
			<section className="account-connections" aria-label={t('Followers & Following')}>
				<Link href="/following?tab=followers">
					<strong>{t('Followers')}</strong>
					<span>{t('People who follow your creator profile.')}</span>
					<CaretRight aria-hidden />
				</Link>
				<Link href="/following?tab=following">
					<strong>{t('Following')}</strong>
					<span>{t('Creators whose work you follow.')}</span>
					<CaretRight aria-hidden />
				</Link>
			</section>
			<nav className="account-overview-links" aria-label={t('Your account')}>
				<Link href="/saved">
					<div>
						<strong>{t('Saved projects')}</strong>
						<p>{t('Revisit the projects you saved.')}</p>
					</div>
					<CaretRight aria-hidden />
				</Link>
				<Link href="/account/settings">
					<div>
						<strong>{t('Account settings')}</strong>
						<p>{t('Edit your photo, name and language.')}</p>
					</div>
					<CaretRight aria-hidden />
				</Link>

				{user.role !== 'ADMIN' && (
					<Link href="/workspace">
						<strong>{t('Workspace')}</strong>
						<CaretRight aria-hidden />
					</Link>
				)}
			</nav>
		</div>
	);
}
