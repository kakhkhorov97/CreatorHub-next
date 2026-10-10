import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { CaretDown, CaretUp } from 'phosphor-react';
import { useApi } from '../../hooks/useApi';
import { QueryState } from '../common/UI';

export default function CategoryShortcuts() {
	const { t: translate } = useSiteTranslation('common');
	const categories = useApi('categories');
	const [expanded, setExpanded] = useState(false);
	const [rowCount, setRowCount] = useState(3);
	const [rowHeight, setRowHeight] = useState(44);
	const linksRef = useRef<HTMLElement>(null);
	const linksId = useId();

	useEffect(() => {
		const nav = linksRef.current;
		if (!nav) return;
		const measure = () => {
			const links = Array.from(nav.querySelectorAll('a'));
			const first = links[0]?.getBoundingClientRect();
			if (!first) return;
			setRowCount(links.filter((link) => Math.abs(link.getBoundingClientRect().top - first.top) < 1).length);
			setRowHeight(Math.ceil(first.height));
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(nav);
		return () => observer.disconnect();
	}, [categories.value, translate]);

	const canExpand = (categories.value?.length || 0) > rowCount;
	return (
		<section className="home-section category-section">
			<div className="home-section-heading">
				<div>
					<h2>{translate('Explore creative categories')}</h2>
					<p className="muted">{translate('Browse projects by discipline and discover creators across Korea.')}</p>
				</div>
			</div>
			<QueryState loading={categories.loading} error={categories.error} retry={() => categories.refetch()} />
			<nav
				ref={linksRef}
				id={linksId}
				className={`category-links${expanded ? '' : ' is-collapsed'}`}
				style={expanded ? undefined : { maxHeight: rowHeight + 12 }}
				aria-label={translate('Project categories')}
			>
				{categories.value?.map((category, index) => {
					const hidden = !expanded && index >= rowCount;
					return (
						<Link
							passHref
							key={category._id}
							href={`/projects?categoryId=${category._id}`}
							tabIndex={hidden ? -1 : undefined}
							aria-hidden={hidden || undefined}
							style={hidden ? { visibility: 'hidden' } : undefined}
						>
							{translate(category.name)}
						</Link>
					);
				})}
			</nav>
			{canExpand && (
				<button
					type="button"
					className="category-toggle"
					aria-expanded={expanded}
					aria-controls={linksId}
					onClick={() => setExpanded((value) => !value)}
				>
					{translate(expanded ? 'Show fewer categories' : 'Show all categories')}
					{expanded ? <CaretUp size={16} aria-hidden /> : <CaretDown size={16} aria-hidden />}
				</button>
			)}
		</section>
	);
}
