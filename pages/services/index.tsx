import { useTranslation as useSiteTranslation } from 'next-i18next';
import { Empty, Heading, Pager, QueryState } from '../../libs/components/common/UI';
import { ServiceCard } from '../../libs/components/discovery/Cards';
import SearchFilters from '../../libs/components/discovery/SearchFilters';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';
import { useApi } from '../../libs/hooks/useApi';
import { useCreatorDirectory } from '../../libs/hooks/useCreatorDirectory';
import { useDiscoveryFilters } from '../../libs/hooks/useDiscoveryFilters';
import { usePaged } from '../../libs/hooks/usePaged';
import { CreatorService } from '../../libs/types/creatorhub';
const kind = 'services' as const;

function ServicesPage() {
	const { t: translate } = useSiteTranslation('common');

	// Search, filters and page live in the URL, so Back returns to the same list position.
	const { ready, filters, page, setFilters, setPage } = useDiscoveryFilters();
	const operation = 'getServices';
	const result = usePaged(operation, { input: { ...filters } }, !ready, 12, 0, { initial: page, onChange: setPage });
	const directory = useCreatorDirectory(result.rows.map((row) => row.creatorId));
	const categories = useApi('categories');
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
							<ServiceCard
								key={s._id}
								service={s}
								creator={directory[s.creatorId]}
								category={categories.value?.find((item) => item._id === s.categoryId)?.name}
							/>
						))}
					</div>
					{!!result.rows.length && <Pager {...result} />}
				</section>
			</div>
		</>
	);
}
export default withLayoutBasic(ServicesPage, 'Find creative services');
