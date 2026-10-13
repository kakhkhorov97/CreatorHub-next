import { useTranslation as useSiteTranslation } from 'next-i18next';
import { CaretDown, MagnifyingGlass, ArrowCounterClockwise } from 'phosphor-react';
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
	loading = false,
}: {
	kind: 'projects' | 'creators' | 'services';
	home?: boolean;
	loading?: boolean;
	filters: DiscoveryInput;
	onSearch: (input: DiscoveryInput) => void;
}) {
	const { t: translate } = useSiteTranslation('common');

	const categories = useApi('categories');
	const cities = useApi('getCities');
	const [searched, setSearched] = useState(false);
	const [category, setCategory] = useState(filters.categoryId || '');
	useEffect(() => setCategory(filters.categoryId || ''), [filters.categoryId]);

	useEffect(() => {
		if (!searched || loading) return;
		const frame = requestAnimationFrame(() => {
			if (window.innerWidth <= 700) {
				const form = document.getElementById(home ? 'homepage-search' : 'directory-search');
				const result = form?.parentElement?.querySelector('.search-result-status');
				if (result)
					window.scrollTo({
						top:
							result.getBoundingClientRect().top +
							window.scrollY -
							(document.querySelector('.site-header')?.getBoundingClientRect().height || 0) -
							16,
						behavior: 'auto',
					});
			}
			setSearched(false);
		});
		return () => cancelAnimationFrame(frame);
	}, [searched, loading, home]);
	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (loading) return;
		setSearched(true);
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
				<Button type="submit" loading={loading} loadingLabel={translate('Searching…')}>
					{translate('Search')}
				</Button>
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
						type="text"
						inputMode="numeric"
						pattern="[0-9]{1,10}"
						maxLength={10}
						onInput={(event) => {
							event.currentTarget.value = event.currentTarget.value.replace(/[^0-9]/g, '');
							event.currentTarget.setCustomValidity(
								Number(event.currentTarget.value) > 1000000000 ? translate('Maximum budget is 1,000,000,000 KRW.') : '',
							);
						}}
						min={0}
						max={1000000000}
						aria-label={translate('Maximum budget in won')}
						placeholder={translate('Max budget (₩)')}
					/>
				)}
				<Button
					secondary
					type="reset"
					className="search-reset"
					aria-label={translate('Reset')}
					title={translate('Reset')}
					onClick={() => {
						setCategory('');
						onSearch({});
					}}
				>
					<ArrowCounterClockwise size={21} aria-hidden />
				</Button>
			</div>
		</form>
	);
}
