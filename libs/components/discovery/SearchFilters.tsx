import { useTranslation as useSiteTranslation } from 'next-i18next';
import { CaretDown, MagnifyingGlass } from 'phosphor-react';
import { FormEvent, useEffect, useState } from 'react';
import CategoryPicker from './CategoryPicker';
import { useApi } from '../../hooks/useApi';
import { DiscoveryInput } from '../../types/creatorhub';
import { Button, optional, values } from '../common/UI';

export default function SearchFilters({
	kind,
	home = false,
	filters,
	onSearch,
}: {
	kind: 'projects' | 'creators' | 'services';
	home?: boolean;
	filters: DiscoveryInput;
	onSearch: (input: DiscoveryInput) => void;
}) {
	const { t: translate } = useSiteTranslation('common');

	const categories = useApi('categories');
	const cities = useApi('getCities');
	const [category, setCategory] = useState(filters.categoryId || '');
	useEffect(() => setCategory(filters.categoryId || ''), [filters.categoryId]);

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const fields = values(event.currentTarget);
		onSearch({
			query: optional(fields.query),
			categoryId: optional(category),
			city: optional(fields.city),
			remoteAvailable: fields.remoteAvailable ? true : undefined,
			...(kind === 'services' && fields.budgetMax ? { budgetMax: Number(fields.budgetMax) } : {}),
		});
	}
	return (
		<form id={home ? 'homepage-search' : 'directory-search'} className="search-form segmented-search" onSubmit={submit}>
			<div className="search-segments">
				<label className="search-query">
					<MagnifyingGlass size={23} />
					<span className="sr-only">
						{translate('Search {{kind}}', {
							kind: translate(kind === 'projects' ? 'Projects' : kind === 'creators' ? 'Creators' : 'Services'),
						})}
					</span>
					<input
						name="query"
						maxLength={200}
						defaultValue={filters.query || ''}
						key={`query-${filters.query || ''}`}
						placeholder={
							kind === 'projects'
								? translate('Search projects, tags, or topics')
								: kind === 'creators'
								? translate('Search skills, headline, or bio')
								: translate('Search services')
						}
					/>
				</label>
				<label className="search-segment desktop-category-filter">
					<span>{translate('Category')}</span>
					<select name="categoryId" value={category} onChange={(event) => setCategory(event.target.value)}>
						<option value="">{translate('All categories')}</option>
						{categories.value?.map((category) => (
							<option key={category._id} value={category._id}>
								{translate(category.name)}
							</option>
						))}
					</select>
				</label>
				<CategoryPicker value={category} onChange={setCategory} />
				<label className="search-segment location-filter">
					<span>{translate('Location')}</span>
					<select
						aria-label={translate('Location')}
						name="city"
						key={filters.city || 'korea'}
						defaultValue={filters.city || ''}
					>
						<option value="">{translate('All Korea')}</option>
						{cities.value?.map((city) => (
							<option key={city.key} value={city.key}>
								{translate(city.nameEn)}
							</option>
						))}
					</select>
					<CaretDown className="location-caret" size={16} aria-hidden="true" />
				</label>
				<Button type="submit">{translate('Search')} </Button>
			</div>
			<div className="filters">
				<label className="checkbox">
					<input type="checkbox" name="remoteAvailable" defaultChecked={filters.remoteAvailable || false} />
					{translate('Remote available')}
				</label>
				{kind === 'services' && (
					<input
						className="budget-filter"
						name="budgetMax"
						type="number"
						min={0}
						max={1000000000}
						aria-label={translate('Maximum budget in won')}
						placeholder={translate('Max budget (₩)')}
					/>
				)}
				<Button
					secondary
					type="reset"
					onClick={() => {
						setCategory('');
						onSearch({});
					}}
				>
					{translate('Reset')}
				</Button>
			</div>
		</form>
	);
}
