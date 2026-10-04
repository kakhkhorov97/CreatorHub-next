import Link from 'next/link';
import { useApi } from '../../hooks/useApi';
import { QueryState } from '../common/UI';

export default function CategoryShortcuts() {
	const categories = useApi('categories');
	return (
		<section className="home-section category-section">
			<div className="home-section-heading">
				<div>
					<h2>Explore creative categories</h2>
					<p className="muted">Browse projects by discipline and discover creators across Korea.</p>
				</div>
			</div>
			<QueryState loading={categories.loading} error={categories.error} retry={() => categories.refetch()} />
			<nav className="category-links" aria-label="Project categories">
				{categories.value?.map((category) => (
					<Link passHref key={category._id} href={`/projects?categoryId=${category._id}`}>
						{category.name}
					</Link>
				))}
			</nav>
		</section>
	);
}
