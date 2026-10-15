import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useApi } from '../../hooks/useApi';
import { QueryState } from '../common/UI';

// Homepage category tabs filter the results in place and mirror the Category dropdown:
// the selected category is pressed, and "All work" is pressed only when no category is chosen.
export default function CategoryShortcuts({
	selected,
	onSelect,
}: {
	selected?: string;
	onSelect: (categoryId?: string) => void;
}) {
	const { t: translate } = useSiteTranslation('common');
	const categories = useApi('categories');
	return (
		<section className="category-section">
			<QueryState loading={categories.loading} error={categories.error} retry={() => categories.refetch()} />
			<nav className="category-links" aria-label={translate('Project categories')}>
				<button type="button" aria-pressed={!selected} onClick={() => onSelect(undefined)}>
					{translate('All work')}
				</button>
				{categories.value?.map((category) => (
					<button
						type="button"
						key={category._id}
						aria-pressed={selected === category._id}
						onClick={() => onSelect(category._id)}
					>
						{translate(category.name)}
					</button>
				))}
			</nav>
		</section>
	);
}
