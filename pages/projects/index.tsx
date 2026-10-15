import { useTranslation as useSiteTranslation } from 'next-i18next';
import { Empty, Heading, Pager, QueryState } from '../../libs/components/common/UI';
import { ProjectCard } from '../../libs/components/discovery/Cards';
import SearchFilters from '../../libs/components/discovery/SearchFilters';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';
import { useCreatorDirectory } from '../../libs/hooks/useCreatorDirectory';
import { useDiscoveryFilters } from '../../libs/hooks/useDiscoveryFilters';
import { usePaged } from '../../libs/hooks/usePaged';
import { PortfolioProject } from '../../libs/types/creatorhub';
const kind = 'projects' as const;

function ProjectsPage() {
	const { t: translate } = useSiteTranslation('common');

	// Search, filters and page live in the URL, so Back returns to the same list position.
	const { ready, filters, page, setFilters, setPage } = useDiscoveryFilters();
	const operation = 'getProjects';
	const result = usePaged(operation, { input: { ...filters } }, !ready, 12, 0, { initial: page, onChange: setPage });
	const directory = useCreatorDirectory(result.rows.map((row) => (row as PortfolioProject).creatorId));
	const title = 'Explore creative work';
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
						{(result.rows as PortfolioProject[]).map((p) => (
							<ProjectCard key={p._id} project={p} creator={directory[p.creatorId]} />
						))}
					</div>
					{!!result.rows.length && <Pager {...result} />}
				</section>
			</div>
		</>
	);
}
export default withLayoutBasic(ProjectsPage, 'Explore creative work');
