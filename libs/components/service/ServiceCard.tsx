import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useCardNavigation } from '../../hooks/useCardNavigation';
import Link from 'next/link';
import { CreatorProfile, CreatorService } from '../../types/creatorhub';
import { label, money, Picture } from '../common/UI';

export function ServiceCard({
	service,
	creator,
	category,
	compact = false,
}: {
	service: CreatorService;
	creator?: CreatorProfile;
	category?: string;
	compact?: boolean;
}) {
	const { t: translate } = useSiteTranslation('common');

	const openCard = useCardNavigation(`/services/${service._id}`);
	return (
		<article
			className={`service-card${compact ? ' compact' : ''}${creator && !compact ? ' with-avatar' : ''}`}
			onClick={openCard}
		>
			{/* Public listings already fall back to the creator's newest project cover. */}
			{!compact && (
				<div className="service-media">
					<Picture src={service.imageUrl} alt={service.title} />
					{category && <span className="service-category">{translate(category)}</span>}
					{creator && <Picture avatar src={creator.identity.avatarUrl} alt="" />}
				</div>
			)}
			<div className="service-body">
				{creator && !compact && (
					<Link passHref href={`/creators/${creator.slug}`} className="service-by">
						{creator.identity.displayName}
						{creator.city ? ` · ${label(creator.city)}` : ''}
					</Link>
				)}
				<Link passHref href={`/services/${service._id}`} className="card-title">
					{service.title}
				</Link>
				<p>{service.description}</p>
				<div className="card-bottom">
					<strong>
						{service.pricingType === 'STARTING_AT'
							? translate('From {{price}}', { price: money(service.startingPrice) })
							: translate('Custom quote')}
					</strong>
					<span className="muted">
						{service.estimatedDays
							? translate('{{days}} days', { days: service.estimatedDays })
							: translate('Scope agreed together')}
					</span>
				</div>
			</div>
		</article>
	);
}
