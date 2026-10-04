import { MagnifyingGlass } from 'phosphor-react';
import { FormEvent } from 'react';
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
	const categories = useApi('categories');
	const cities = useApi('getCities');

	function submit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const fields = values(event.currentTarget);
		onSearch({
			query: optional(fields.query),
			categoryId: optional(fields.categoryId),
			city: optional(fields.city),
			remoteAvailable: fields.remoteAvailable ? true : undefined,
			...(kind !== 'projects' && fields.budgetMax ? { budgetMax: Number(fields.budgetMax) } : {}),
		});
	}
	return (
		<form id={home ? 'homepage-search' : undefined} className="search-form segmented-search" onSubmit={submit}>
			<div className="search-segments">
				<label className="search-query">
					<MagnifyingGlass size={23} />
					<span className="sr-only">Search {kind}</span>
					<input
						name="query"
						maxLength={200}
						defaultValue={filters.query || ''}
						key={`query-${filters.query || ''}`}
						placeholder={
							kind === 'projects'
								? 'Search projects, tags, or topics'
								: kind === 'creators'
								? 'Search skills, headline, or bio'
								: 'Search services'
						}
					/>
				</label>
				<label className="search-segment">
					<span>Category</span>
					<select name="categoryId" key={filters.categoryId || 'all'} defaultValue={filters.categoryId || ''}>
						<option value="">All categories</option>
						{categories.value?.map((category) => (
							<option key={category._id} value={category._id}>
								{category.name}
							</option>
						))}
					</select>
				</label>
				<label className="search-segment">
					<span>Location</span>
					<select name="city" key={filters.city || 'korea'} defaultValue={filters.city || ''}>
						<option value="">All Korea</option>
						{cities.value?.map((city) => (
							<option key={city.key} value={city.key}>
								{city.nameEn}
							</option>
						))}
					</select>
				</label>
				<Button type="submit">Search</Button>
			</div>
			<div className="filters">
				<label className="checkbox">
					<input type="checkbox" name="remoteAvailable" defaultChecked={filters.remoteAvailable || false} />
					Remote available
				</label>
				{kind !== 'projects' && (
					<input
						className="budget-filter"
						name="budgetMax"
						type="number"
						min={0}
						max={1000000000}
						aria-label="Maximum budget in won"
						placeholder="Max budget (₩)"
					/>
				)}
				<Button secondary type="reset" onClick={() => onSearch({})}>
					Reset
				</Button>
			</div>
		</form>
	);
}
