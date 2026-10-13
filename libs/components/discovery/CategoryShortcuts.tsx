import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { QueryState } from '../common/UI';

export default function CategoryShortcuts() {
	const { t: translate } = useSiteTranslation('common');
	const categories = useApi('categories');
	return (
		<section className="category-section">
			<QueryState loading={categories.loading} error={categories.error} retry={() => categories.refetch()} />
			<nav className="category-links" aria-label={translate('Project categories')}>
				<Link passHref href="/projects" className="is-all">
					{translate('All work')}
				</Link>
				{categories.value?.map((category) => (
					<Link passHref key={category._id} href={`/projects?categoryId=${category._id}`}>
						{translate(category.name)}
					</Link>
				))}
			</nav>
		</section>
	);
}
