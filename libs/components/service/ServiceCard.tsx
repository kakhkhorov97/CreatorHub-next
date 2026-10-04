import Link from 'next/link';
import { ArrowUpRight } from 'phosphor-react';
import { CreatorProfile, CreatorService } from '../../types/creatorhub';
import { money, Picture } from '../common/UI';

export function ServiceCard({ service, creator }: { service: CreatorService; creator?: CreatorProfile }) {
	return (
		<article className="service-card">
			<Link passHref href={`/services/${service._id}`} className="card-title">
				{service.title}
			</Link>
			{creator && (
				<Link passHref href={`/creators/${creator.slug}`} className="creator-line">
					<Picture avatar src={creator.identity.avatarUrl} />
					{creator.identity.displayName}
				</Link>
			)}
			<p>{service.description}</p>
			<ul>
				{service.deliverables.slice(0, 3).map((item) => (
					<li key={item}>{item}</li>
				))}
			</ul>
			<div className="card-bottom">
				<strong>
					{service.pricingType === 'STARTING_AT' ? `From ${money(service.startingPrice)}` : 'Custom quote'}
				</strong>
				<Link passHref href={`/services/${service._id}`}>
					View service <ArrowUpRight />
				</Link>
			</div>
		</article>
	);
}
