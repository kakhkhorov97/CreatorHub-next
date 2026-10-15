import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useCardNavigation } from '../../hooks/useCardNavigation';
import Link from 'next/link';
import { CreatorProfile } from '../../types/creatorhub';
import { label, Picture } from '../common/UI';

export function CreatorCard({ creator }: { creator: CreatorProfile }) {
	const { t: translate } = useSiteTranslation('common');

	const openCard = useCardNavigation(`/creators/${creator.slug}`);
	// Covers of the two newest published projects; the creators list is the only query that fills them.
	// Always two slots, so every card has the same height. Empty slots stay empty rather than repeating work.
	const work = (creator.workImageUrls || []).slice(0, 2);
	return (
		<article className="creator-card" onClick={openCard}>
			<div className="work-strip">
				{work.length ? (
					<>
						{work.map((url) => (
							<Picture key={url} src={url} alt="" sizes="(max-width: 600px) 50vw, 200px" />
						))}
						{work.length === 1 && <span className="work-slot-empty" aria-hidden />}
					</>
				) : (
					<>
						<span className="work-slot-empty" aria-hidden />
						<span className="work-slot-empty" aria-hidden />
						<span className="work-strip-note">{translate('No published work yet')}</span>
					</>
				)}
			</div>
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
