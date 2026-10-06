import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Heading, LinkButton, money, Picture, QueryState } from '../../libs/components/common/UI';
import Layout from '../../libs/components/layout/LayoutBasic';
import { useApi } from '../../libs/hooks/useApi';
import { useCreatorDirectory } from '../../libs/hooks/useCreatorDirectory';

function ServiceDetail() {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const id = String(router.query.id || '');
	const result = useApi('getService', { serviceId: id }, !id);
	const s = result.value;
	const creators = useCreatorDirectory(s ? [s.creatorId] : []);
	const creator = s && creators[s.creatorId];
	return (
		<Layout title={s?.title || translate('Service')}>
			<Link passHref href="/services" className="back-link">
				{translate('Back to services')}
			</Link>
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
					<div className="detail-layout">
						<section className="prose">
							<h2>{translate('About this service')}</h2>
							<p>{s.description}</p>
							<h2>{translate('What’s included')}</h2>
							<ul>
								{s.deliverables.map((d) => (
									<li key={d}>{d}</li>
								))}
							</ul>
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
