import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { X } from 'phosphor-react';
import { useRef } from 'react';
import { Button, Empty, Pager, QueryState } from '../libs/components/common/UI';
import HeroBackdrop from '../libs/components/discovery/HeroBackdrop';
import CategoryShortcuts from '../libs/components/discovery/CategoryShortcuts';
import HomeSections from '../libs/components/discovery/HomeSections';
import SearchFilters from '../libs/components/discovery/SearchFilters';
import withLayoutHome from '../libs/components/layout/LayoutHome';
import { ProjectCard } from '../libs/components/project/ProjectCard';
import { useApi } from '../libs/hooks/useApi';
import { useCreatorDirectory } from '../libs/hooks/useCreatorDirectory';
import { hasDiscoveryFilters, useDiscoveryFilters } from '../libs/hooks/useDiscoveryFilters';
import { usePaged } from '../libs/hooks/usePaged';
import { koreaCopy } from '../libs/utils/korea';

function Home() {
	const { t: translate } = useSiteTranslation('common');

	// Search and filters live in the URL, so Back from a project returns to the same results.
	const { ready, filters, page, setFilters, setPage } = useDiscoveryFilters();
	const searching = hasDiscoveryFilters(filters);
	const site = useApi('getSiteContent');
	const categories = useApi('categories');
	const cities = useApi('getCities');
	const projects = usePaged('getProjects', { input: { ...filters, sort: 'POPULAR' } }, !ready, 8, 0, {
		initial: page,
		onChange: setPage,
	});
	const creators = useCreatorDirectory(projects.rows.map((project) => project.creatorId));
	// Recently added excludes the default popular selection, not whatever the current search returned.
	const popularIds = useRef<string[]>([]);
	if (!searching && !projects.loading && !projects.error)
		popularIds.current = projects.rows.map((project) => project._id);
	const count = projects.total ?? projects.rows.length;
	const categoryName = categories.value?.find((item) => item._id === filters.categoryId)?.name;
	const cityName = cities.value?.find((item) => item.key === filters.city)?.nameEn;

	return (
		<>
			<div className="discovery-full discovery-home">
				<section id="projects">
					<div className="discovery-search-section">
						<HeroBackdrop />
						<div className="discovery-hero">
							<h1>{translate(site.value?.homeHeading || 'Find your next creative collaborator.')}</h1>
							<p>
								{translate(
									koreaCopy(
										site.value?.homeSubheading || 'Discover creators, creative work, and services across Korea.',
									),
								)}
							</p>
						</div>
						<SearchFilters loading={projects.loading} kind="projects" home filters={filters} onSearch={setFilters} />
					</div>
					<CategoryShortcuts
						selected={filters.categoryId || undefined}
						onSelect={(categoryId) => setFilters({ ...filters, categoryId })}
					/>
					<div className="home-section-heading">
						<div>
							<h2>{searching ? translate('Search results') : translate('Popular projects')}</h2>
							{searching ? (
								<p className="muted search-result-count" role="status">
									{projects.loading
										? translate('Searching…')
										: count === 1
										? translate('1 project found')
										: translate('{{count}} projects found', { count })}
								</p>
							) : (
								<p className="muted">{translate('Work the community has liked. Newer projects break ties.')}</p>
							)}
						</div>
						{!searching && (
							<Link passHref href="/projects">
								{translate('View all projects →')}
							</Link>
						)}
					</div>
					{searching && (
						<div className="active-search" aria-label={translate('Active search and filters')}>
							<ul>
								{filters.query && <li>“{filters.query}”</li>}
								{filters.categoryId && <li>{translate(categoryName || 'Category')}</li>}
								{filters.city && <li>{translate(cityName || 'Location')}</li>}
								{filters.remoteAvailable && <li>{translate('Remote available')}</li>}
							</ul>
							<Button secondary className="clear-search" onClick={() => setFilters({})}>
								<X size={16} aria-hidden />
								{translate('Clear search and filters')}
							</Button>
						</div>
					)}
					<QueryState loading={projects.loading} error={projects.error} retry={() => projects.refetch()} />
					{!projects.loading && !projects.error && !projects.rows.length && (
						<Empty title={searching ? translate('No projects found') : translate('No matches yet')}>
							{searching
								? translate(
										'Try different keywords, choose another category or location, or clear your search and filters.',
								  )
								: translate('Try another search or clear your filters.')}
						</Empty>
					)}
					<div className={`grid projects ${searching ? 'is-search-results' : ''}`}>
						{projects.rows.map((project) => (
							<ProjectCard key={project._id} project={project} creator={creators[project.creatorId]} />
						))}
					</div>
					{searching && !!projects.rows.length && <Pager {...projects} />}
				</section>
			</div>
			<HomeSections popularIds={popularIds.current} loadingPopular={!ready || (!searching && projects.loading)} />
		</>
	);
}

export default withLayoutHome(Home);
