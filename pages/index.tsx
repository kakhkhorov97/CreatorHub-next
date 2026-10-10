import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useState } from 'react';
import { Empty, QueryState } from '../libs/components/common/UI';
import CategoryShortcuts from '../libs/components/discovery/CategoryShortcuts';
import HomeSections from '../libs/components/discovery/HomeSections';
import SearchFilters from '../libs/components/discovery/SearchFilters';
import withLayoutHome from '../libs/components/layout/LayoutHome';
import { ProjectCard } from '../libs/components/project/ProjectCard';
import { useApi } from '../libs/hooks/useApi';
import { useCreatorDirectory } from '../libs/hooks/useCreatorDirectory';
import { usePaged } from '../libs/hooks/usePaged';
import { DiscoveryInput } from '../libs/types/creatorhub';
import { koreaCopy } from '../libs/utils/korea';

function Home() {
	const { t: translate } = useSiteTranslation('common');

	const [filters, setFilters] = useState<DiscoveryInput>({});
	const site = useApi('getSiteContent');
	const projects = usePaged('getProjects', { input: { ...filters, sort: 'POPULAR' } }, false, 6);
	const creators = useCreatorDirectory(projects.rows.map((project) => project.creatorId));

	return (
		<>
			<div className="discovery-full discovery-home">
				<section id="projects">
					<div className="discovery-search-section">
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
						<SearchFilters kind="projects" home filters={filters} onSearch={setFilters} />
					</div>
					<CategoryShortcuts />
					<div className="home-section-heading">
						<div>
							<h2>{translate('Popular projects')}</h2>
							<p className="muted">{translate('Work the community has liked. Newer projects break ties.')}</p>
						</div>
						<Link passHref href="/projects">
							{translate('View all projects →')}
						</Link>
					</div>
					<QueryState loading={projects.loading} error={projects.error} retry={() => projects.refetch()} />
					{!projects.loading && !projects.error && !projects.rows.length && (
						<Empty title={translate('No matches yet')}>{translate('Try another search or clear your filters.')}</Empty>
					)}
					<div className="grid projects">
						{projects.rows.map((project) => (
							<ProjectCard key={project._id} project={project} creator={creators[project.creatorId]} />
						))}
					</div>
				</section>
			</div>
			<HomeSections
				popularIds={projects.rows.map((project) => project._id)}
				loadingPopular={projects.loading || !!projects.error}
			/>
		</>
	);
}

export default withLayoutHome(Home);
