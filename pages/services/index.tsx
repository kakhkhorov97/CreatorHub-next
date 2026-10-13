import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Empty, Heading, Pager, QueryState } from '../../libs/components/common/UI';
import { ServiceCard } from '../../libs/components/discovery/Cards';
import SearchFilters from '../../libs/components/discovery/SearchFilters';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';
import { useCreatorDirectory } from '../../libs/hooks/useCreatorDirectory';
import { usePaged } from '../../libs/hooks/usePaged';
import { CreatorService, DiscoveryInput } from '../../libs/types/creatorhub';
const kind = 'services' as const;

function ServicesPage() {
	const { t: translate } = useSiteTranslation('common');

	const router = useRouter();
	const [filters, setFilters] = useState<DiscoveryInput>({});
	useEffect(() => {
		if (router.isReady)
			setFilters({
				categoryId: typeof router.query.categoryId === 'string' ? router.query.categoryId : undefined,
				query: typeof router.query.query === 'string' ? router.query.query : undefined,
			});
	}, [router.isReady, router.query.categoryId, router.query.query]);
	const operation = 'getServices';
	const result = usePaged(operation, { input: { ...filters } }, false, 12);
	const directory = useCreatorDirectory(result.rows.map((row) => row.creatorId));
	const title = 'Find creative services';
	return (
		<>
			<div className="discovery-full">
				<section>
					{<Heading title={title} />}
					<SearchFilters loading={result.loading} kind={kind} home={false} filters={filters} onSearch={setFilters} />

					<p className="search-result-status" role="status">
						{result.loading
							? translate('Searching…')
							: translate('Results on this page: {{count}}', { count: result.rows.length })}
					</p>
					<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
					{!result.loading && !result.error && !result.rows.length && (
						<Empty title={translate('No matches yet')}>{translate('Try another search or clear your filters.')}</Empty>
					)}
					<div className={`grid ${kind}`}>
						{(result.rows as CreatorService[]).map((s) => (
							<ServiceCard key={s._id} service={s} creator={directory[s.creatorId]} />
						))}
					</div>
					{!!result.rows.length && <Pager {...result} />}
				</section>
			</div>
		</>
	);
}
export default withLayoutBasic(ServicesPage, 'Find creative services');
