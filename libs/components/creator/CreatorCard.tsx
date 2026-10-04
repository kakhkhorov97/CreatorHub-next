import { useCardNavigation } from '../../hooks/useCardNavigation';
import Link from 'next/link';
import { ArrowUpRight, MapPin } from 'phosphor-react';
import { CreatorProfile } from '../../types/creatorhub';
import { label, Picture } from '../common/UI';

export function CreatorCard({ creator }: { creator: CreatorProfile }) {
	const openCard = useCardNavigation(`/creators/${creator.slug}`);
	return (
		<article className="creator-card" onClick={openCard}>
			<div className="creator-top">
				<Picture avatar src={creator.identity.avatarUrl} alt={creator.identity.displayName} />
				<div>
					<Link passHref className="card-title" href={`/creators/${creator.slug}`}>
						{creator.identity.displayName}
					</Link>
					<p>{creator.headline}</p>
				</div>
			</div>
			<p className="muted">
				<MapPin size={16} />
				{label(creator.city)}
				{creator.remoteAvailable ? ' · Remote available' : ''}
			</p>
			<div className="tags">
				{creator.skills.slice(0, 4).map((s) => (
					<span key={s}>{s}</span>
				))}
			</div>
			<div className="card-bottom">
				<span className={`availability ${creator.availability.toLowerCase()}`}>{label(creator.availability)}</span>
				<Link passHref href={`/creators/${creator.slug}`}>
					View profile <ArrowUpRight />
				</Link>
			</div>
		</article>
	);
}
