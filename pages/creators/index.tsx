import { useTranslation as useSiteTranslation } from 'next-i18next';
import { Empty, Heading, Pager, QueryState } from '../../libs/components/common/UI';
import { CreatorCard } from '../../libs/components/discovery/Cards';
import SearchFilters from '../../libs/components/discovery/SearchFilters';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';
import { useCreatorDirectory } from '../../libs/hooks/useCreatorDirectory';
import { useDiscoveryFilters } from '../../libs/hooks/useDiscoveryFilters';
import { usePaged } from '../../libs/hooks/usePaged';
import { CreatorProfile } from '../../libs/types/creatorhub';
const kind = 'creators' as const;

function CreatorsPage() {
	const { t: translate } = useSiteTranslation('common');

	// Search, filters and page live in the URL, so Back returns to the same list position.
	const { ready, filters, page, setFilters, setPage } = useDiscoveryFilters();
	const operation = 'getCreators';
	const result = usePaged(operation, { input: { ...filters } }, !ready, 12, 0, { initial: page, onChange: setPage });
	const directory = useCreatorDirectory([]);
	const title = 'Discover creators';
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
						{(result.rows as CreatorProfile[]).map((c) => (
							<CreatorCard key={c._id} creator={c} />
						))}
					</div>
					{!!result.rows.length && <Pager {...result} />}
				</section>
			</div>
		</>
	);
}
export default withLayoutBasic(CreatorsPage, 'Discover creators');
