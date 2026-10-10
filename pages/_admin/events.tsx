import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useState } from 'react';
import {
	Button,
	Feedback,
	Field,
	Heading,
	Notice,
	Pager,
	QueryState,
	Status,
	TextArea,
	values,
} from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useAction } from '../../libs/hooks/useApi';
import { usePaged } from '../../libs/hooks/usePaged';
import { CreativeEvent, EventStatus } from '../../libs/types/creatorhub';

export default function EventsAdmin() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Manage events')} area="admin">
			<Guard adminOnly>
				<EventContent />
			</Guard>
		</Layout>
	);
}

function EventContent() {
	const { t: translate } = useSiteTranslation('common');

	const result = usePaged('adminEvents', { input: { upcoming: false } }, false, 20);
	const action = useAction();
	const [selected, setSelected] = useState<CreativeEvent | null>(null);
	const [saved, setSaved] = useState(false);
	const dateInput = (value?: string) => (value ? new Date(value).toISOString().slice(0, 16) : '');
	return (
		<>
			<Heading title={translate('Events')}>
				<Button
					onClick={() => {
						setSelected(null);
						setSaved(false);
					}}
				>
					{translate('New event')}
				</Button>
			</Heading>
			<div className="admin-layout">
				<section>
					<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
					<p className="muted">
						{translate('Publish upcoming events or archive finished listings. All times below are UTC.')}
					</p>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>{translate('Event')}</th>
									<th>{translate('Status')}</th>
									<th>{translate('Starts, UTC')}</th>
									<th>{translate('Actions')}</th>
								</tr>
							</thead>
							<tbody>
								{result.value?.map((event) => (
									<tr key={event._id}>
										<td>
											{event.title}
											{event.isDemo && <small> {translate('· Fictional')}</small>}
										</td>
										<td>
											<Status value={event.status} />
										</td>
										<td>{dateInput(event.startsAt).replace('T', ' ')}</td>
										<td>
											<Button
												secondary
												onClick={() => {
													setSelected(event);
													setSaved(false);
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
					<Pager {...result} />
				</section>
				<form
					key={selected?._id || 'new'}
					className="panel"
					onSubmit={(e) => {
						e.preventDefault();
						const f = values(e.currentTarget);
						action.run(async () => {
							const input = {
								title: f.title,
								description: f.description,
								startsAt: new Date(f.startsAt + ':00Z').toISOString(),
								endsAt: new Date(f.endsAt + ':00Z').toISOString(),
								location: f.location,
								eventUrl: f.eventUrl || '',
								status: f.status as EventStatus,
								isDemo: !!f.isDemo,
							};
							const record = selected
								? await action.mutate('updateEvent', { id: selected._id, input })
								: await action.mutate('createEvent', { input });
							setSelected(record);
							await result.refetch();
							setSaved(true);
						});
					}}
				>
					<h2>{selected ? translate('Edit event') : translate('New event')}</h2>
					<Field label={translate('Title')} name="title" required maxLength={160} defaultValue={selected?.title} />
					<TextArea
						label={translate('Description')}
						name="description"
						required
						maxLength={3000}
						defaultValue={selected?.description}
					/>
					<Field
						label={translate('Starts, UTC')}
						name="startsAt"
						type="datetime-local"
						required
						defaultValue={dateInput(selected?.startsAt)}
					/>
					<Field
						label={translate('Ends, UTC')}
						name="endsAt"
						type="datetime-local"
						required
						defaultValue={dateInput(selected?.endsAt)}
					/>
					<Field
						label={translate('Location or online meeting')}
						name="location"
						required
						maxLength={200}
						defaultValue={selected?.location}
					/>
					<Field
						label={translate('Event website, optional')}
						name="eventUrl"
						type="url"
						pattern="https://.*"
						maxLength={2000}
						defaultValue={selected?.eventUrl || ''}
						hint={translate('Use an HTTPS address. Fictional event concepts do not show registration links.')}
					/>
					<Field label={translate('Status')}>
						<select name="status" defaultValue={selected?.status || 'DRAFT'}>
							<option value="DRAFT">{translate('Draft')}</option>
							<option value="PUBLISHED">{translate('Published')}</option>
							<option value="ARCHIVED">{translate('Archived')}</option>
						</select>
					</Field>
					<label className="checkbox">
						<input name="isDemo" type="checkbox" defaultChecked={selected?.isDemo ?? false} />
						{translate('Fictional event concept')}
					</label>
					<Feedback {...action} />
					{saved && <Notice notify>{translate('Event saved.')}</Notice>}
					<Button type="submit" disabled={action.busy}>
						{translate('Save event')}
					</Button>
				</form>
			</div>
		</>
	);
}
