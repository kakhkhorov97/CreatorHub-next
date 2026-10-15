import { useTranslation as useSiteTranslation } from 'next-i18next';
import { MagnifyingGlass, ArrowCounterClockwise } from 'phosphor-react';
import { FormEvent, useEffect, useState } from 'react';
import OptionSheet from './OptionSheet';
import { useApi } from '../../hooks/useApi';
import { DiscoveryInput } from '../../types/creatorhub';
import { useFormValidation } from '../../hooks/useFormValidation';
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

	const validation = useFormValidation();
	const categories = useApi('categories');
	const cities = useApi('getCities');
	const [category, setCategory] = useState(filters.categoryId || '');
	useEffect(() => setCategory(filters.categoryId || ''), [filters.categoryId]);
	const [city, setCity] = useState(filters.city || '');
	useEffect(() => setCity(filters.city || ''), [filters.city]);
	const categoryOptions = (categories.value || []).map((item) => ({ value: item._id, label: translate(item.name) }));
	const cityOptions = (cities.value || []).map((item) => ({ value: item.key, label: translate(item.nameEn) }));

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (loading || !validation.validate(event.currentTarget)) return;
		const fields = values(event.currentTarget);
		onSearch({
			query: optional(fields.query),
			categoryId: optional(category),
			city: optional(city),
			remoteAvailable: fields.remoteAvailable ? true : undefined,
			...(kind === 'services' && fields.budgetMax ? { budgetMax: Number(fields.budgetMax) } : {}),
		});
	}
	return (
		<form
			{...validation.form}
			id={home ? 'homepage-search' : 'directory-search'}
			className="search-form segmented-search"
			onSubmit={submit}
		>
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
				{/* Computers: two native selects. Phones: the same two fields as matching bottom sheets. */}
				<label className="search-segment desktop-search-filter">
					<span>{translate('Category')}</span>
					<select name="categoryId" value={category} onChange={(event) => setCategory(event.target.value)}>
						<option value="">{translate('All categories')}</option>
						{categoryOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label className="search-segment desktop-search-filter">
					<span>{translate('Location')}</span>
					<select name="city" value={city} onChange={(event) => setCity(event.target.value)}>
						<option value="">{translate('All Korea')}</option>
						{cityOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<OptionSheet
					label={translate('Category')}
					title={translate('Choose a category')}
					allLabel={translate('All categories')}
					value={category}
					options={categoryOptions}
					loading={categories.loading}
					error={!!categories.error}
					onRetry={() => categories.refetch()}
					onChange={setCategory}
				/>
				<OptionSheet
					label={translate('Location')}
					title={translate('Choose a location')}
					allLabel={translate('All Korea')}
					value={city}
					options={cityOptions}
					loading={cities.loading}
					error={!!cities.error}
					onRetry={() => cities.refetch()}
					onChange={setCity}
				/>
				<Button
					type="submit"
					className="search-submit"
					loading={loading}
					aria-label={loading ? translate('Searching…') : undefined}
				>
					{translate('Search')}
				</Button>
			</div>
			<div className="filters">
				<label className="checkbox">
					<input
						type="checkbox"
						name="remoteAvailable"
						key={`remote-${!!filters.remoteAvailable}`}
						defaultChecked={filters.remoteAvailable || false}
					/>
					{translate('Remote available')}
				</label>
				{kind === 'services' && (
					<input
						className="budget-filter"
						key={`budget-${filters.budgetMax ?? ''}`}
						defaultValue={filters.budgetMax ?? ''}
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
						aria-invalid={validation.errors.budgetMax ? true : undefined}
						aria-describedby={validation.errors.budgetMax ? 'budget-filter-error' : undefined}
						placeholder={translate('Max budget (₩)')}
					/>
				)}
				{validation.errors.budgetMax && (
					<small id="budget-filter-error" className="field-error budget-filter-error" role="alert">
						{validation.errors.budgetMax}
					</small>
				)}
				<Button
					secondary
					type="reset"
					className="search-reset"
					aria-label={translate('Reset')}
					title={translate('Reset')}
					onClick={() => {
						validation.clear();
						setCategory('');
						setCity('');
						onSearch({});
					}}
				>
					<ArrowCounterClockwise size={21} aria-hidden />
				</Button>
			</div>
		</form>
	);
}
