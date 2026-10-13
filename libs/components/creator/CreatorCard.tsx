import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useCardNavigation } from '../../hooks/useCardNavigation';
import Link from 'next/link';
import { CreatorProfile } from '../../types/creatorhub';
import { label, Picture } from '../common/UI';

export function CreatorCard({ creator }: { creator: CreatorProfile }) {
	const { t: translate } = useSiteTranslation('common');

	const openCard = useCardNavigation(`/creators/${creator.slug}`);
	// Covers of the three newest published projects; the creators list is the only query that fills them.
	const work = (creator.workImageUrls || []).slice(0, 3);
	return (
		<article className="creator-card" onClick={openCard}>
			{!!work.length && (
				<div className="work-strip" data-count={work.length}>
					{work.map((url) => (
						<Picture key={url} src={url} alt="" />
					))}
				</div>
			)}
			<div className="creator-top">
				<Picture avatar src={creator.identity.avatarUrl} alt={creator.identity.displayName} />
				<div>
					<Link passHref className="card-title" href={`/creators/${creator.slug}`}>
						{creator.identity.displayName}
					</Link>
					<p className="muted">
						{[creator.headline, creator.city && label(creator.city), creator.remoteAvailable && translate('Remote')]
							.filter(Boolean)
							.join(' · ')}
					</p>
				</div>
			</div>
		</article>
	);
}
