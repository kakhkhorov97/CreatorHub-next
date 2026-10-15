import Image from 'next/image';
import {
	ServiceProcess,
	isConceptService,
	conceptImage,
	conceptCopy,
} from '../../libs/components/discovery/ConceptDetails';
import { socialPageProps, SocialPageProps } from '../../libs/server/socialMetadata';
import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { BackLink } from '../../libs/components/common/BackLink';
import { useRouter } from 'next/router';
import { Heading, LinkButton, money, Picture, QueryState } from '../../libs/components/common/UI';
import Layout from '../../libs/components/layout/LayoutBasic';
import { useApi } from '../../libs/hooks/useApi';
import { useCreatorDirectory } from '../../libs/hooks/useCreatorDirectory';

function ServiceDetail({ seo }: SocialPageProps) {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const id = String(router.query.id || '');
	const result = useApi('getService', { serviceId: id }, !id);
	const s = result.value;
	const creators = useCreatorDirectory(s ? [s.creatorId] : []);
	const creator = s && creators[s.creatorId];
	const demo = !!s && isConceptService(creator?.slug, s.description);
	return (
		<Layout seo={seo} title={s?.title || translate('Service')}>
			<BackLink href="/services" label={translate('Back to services')} />
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			{s && (
				<>
					<Heading title={s.title} />
					{creator && (
						<Link passHref className="creator-line" href={`/creators/${creator.slug}`}>
							<Picture avatar src={creator.identity.avatarUrl} />
							{creator.identity.displayName}
						</Link>
					)}
					<div className="detail-layout service-detail-layout">
						<section className="prose">
							<h2>{translate('About this service')}</h2>
							<p className="preserve-lines">{demo ? conceptCopy(s.description) : s.description}</p>
							{demo && (
								<figure className="concept-gallery">
									<Image
										width={1600}
										height={1000}
										sizes="(max-width: 700px) 100vw, 65vw"
										src={conceptImage(s.title)}
										alt={translate('Supporting concept study')}
										loading="lazy"
									/>
									<figcaption>
										{translate('Concept service. The examples illustrate a possible creative brief.')}
									</figcaption>
								</figure>
							)}
							<h2>{translate('What’s included')}</h2>
							<ul>
								{s.deliverables.map((d) => (
									<li key={d}>{d}</li>
								))}
							</ul>
							<ServiceProcess demo={demo} />
						</section>
						<aside className="panel service-summary">
							<h2>{s.pricingType === 'STARTING_AT' ? `From ${money(s.startingPrice)}` : translate('Custom quote')}</h2>
							{s.estimatedDays && (
								<p>
									{translate('Estimated delivery:')} {s.estimatedDays} {translate('days')}
								</p>
							)}
							<p>{translate('Discuss the scope and timing directly with the creator.')}</p>
							<LinkButton href={`/inquiries/new?creatorId=${s.creatorId}&serviceId=${s._id}`}>
								{translate('Send inquiry')}
							</LinkButton>
						</aside>
					</div>
				</>
			)}
		</Layout>
	);
}

export default ServiceDetail;

export const getServerSideProps = socialPageProps('service');
