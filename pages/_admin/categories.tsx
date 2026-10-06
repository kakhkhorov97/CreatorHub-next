import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';
import {
	Button,
	Feedback,
	Field,
	Heading,
	Notice,
	optional,
	QueryState,
	TextArea,
	values,
} from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useAction, useApi } from '../../libs/hooks/useApi';
import { Category } from '../../libs/types/creatorhub';

export default function Categories() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Categories')} area="admin">
			<Guard adminOnly>
				<CategoryContent />
			</Guard>
		</Layout>
	);
}

function CategoryContent() {
	const { t: translate } = useSiteTranslation('common');

	const result = useApi('adminCategories');
	const [selected, setSelected] = useState<Category | null>(null);
	const action = useAction();
	const [saved, setSaved] = useState(false);
	const editorRef = useRef<HTMLFormElement>(null);
	const [activation, setActivation] = useState(0);
	useEffect(() => {
		if (!activation) return;
		editorRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
		editorRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus({ preventScroll: true });
	}, [activation]);
	return (
		<>
			<Heading title={translate('Categories')}>
				<Button
					onClick={() => {
						setSelected(null);
						setSaved(false);
						setActivation((value) => value + 1);
					}}
				>
					{translate('New category')}
				</Button>
			</Heading>
			<div className="admin-layout">
				<section>
					<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>{translate('Name')}</th>
									<th>{translate('Slug')}</th>
									<th>{translate('Active')}</th>
									<th>{translate('Order')}</th>
									<th>{translate('Actions')}</th>
								</tr>
							</thead>
							<tbody>
								{result.value?.map((c) => (
									<tr key={c._id}>
										<td>{translate(c.name)}</td>
										<td>{c.slug}</td>
										<td>{c.isActive ? translate('Yes') : translate('No')}</td>
										<td>{c.sortOrder}</td>
										<td>
											<Button
												secondary
												onClick={() => {
													setSelected(c);
													setSaved(false);
													setActivation((value) => value + 1);
												}}
											>
												{translate('Edit')}
											</Button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>
				<form
					ref={editorRef}
					key={selected?._id || 'new'}
					className="panel"
					onSubmit={(e) => {
						e.preventDefault();
						const f = values(e.currentTarget);
						action.run(async () => {
							const input = {
								name: f.name,
								slug: f.slug,
								description: optional(f.description),
								isActive: !!f.isActive,
								sortOrder: Number(f.sortOrder),
							};
							if (selected) await action.mutate('updateCategory', { id: selected._id, input });
							else setSelected(await action.mutate('createCategory', { input }));
							await result.refetch();
							setSaved(true);
						});
					}}
				>
					<h2>{selected ? translate('Edit category') : translate('New category')}</h2>
					<Field label={translate('Name')} name="name" required maxLength={80} defaultValue={selected?.name} />
					<Field
						label={translate('Slug')}
						name="slug"
						required
						minLength={2}
						maxLength={80}
						pattern="[a-z0-9]+(-[a-z0-9]+)*"
						defaultValue={selected?.slug}
					/>
					<TextArea
						label={translate('Description')}
						name="description"
						maxLength={500}
						defaultValue={selected?.description || ''}
					/>
					<label className="checkbox">
						<input type="checkbox" name="isActive" defaultChecked={selected?.isActive ?? true} />
						{translate('Active')}
					</label>
					<Field
						label={translate('Sort order')}
						name="sortOrder"
						type="number"
						required
						min={0}
						max={10000}
						defaultValue={selected?.sortOrder ?? 0}
					/>
					<Feedback {...action} />
					{saved && <Notice notify>{translate('Category saved.')}</Notice>}
					<Button type="submit" disabled={action.busy}>
						{translate('Save changes')}
					</Button>
				</form>
			</div>
		</>
	);
}
