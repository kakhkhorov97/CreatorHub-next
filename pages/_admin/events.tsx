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
	return (
		<Layout title="Manage events" area="admin">
			<Guard adminOnly>
				<EventContent />
			</Guard>
		</Layout>
	);
}

function EventContent() {
	const result = usePaged('adminEvents', { input: { upcoming: false } }, false, 20);
	const action = useAction();
	const [selected, setSelected] = useState<CreativeEvent | null>(null);
	const [saved, setSaved] = useState(false);
	const dateInput = (value?: string) => (value ? new Date(value).toISOString().slice(0, 16) : '');
	return (
		<>
			<Heading title="Events">
				<Button
					onClick={() => {
						setSelected(null);
						setSaved(false);
					}}
				>
					New event
				</Button>
			</Heading>
			<div className="admin-layout">
				<section>
					<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
					<p className="muted">Publish upcoming events or archive finished listings. All times below are UTC.</p>
					<div className="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Event</th>
									<th>Status</th>
									<th>Starts, UTC</th>
									<th>Actions</th>
								</tr>
							</thead>
							<tbody>
								{result.value?.map((event) => (
									<tr key={event._id}>
										<td>
											{event.title}
											{event.isDemo && <small> · Demo</small>}
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
												Edit
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
					<h2>{selected ? 'Edit event' : 'New event'}</h2>
					<Field label="Title" name="title" required maxLength={160} defaultValue={selected?.title} />
					<TextArea
						label="Description"
						name="description"
						required
						maxLength={3000}
						defaultValue={selected?.description}
					/>
					<Field
						label="Starts, UTC"
						name="startsAt"
						type="datetime-local"
						required
						defaultValue={dateInput(selected?.startsAt)}
					/>
					<Field
						label="Ends, UTC"
						name="endsAt"
						type="datetime-local"
						required
						defaultValue={dateInput(selected?.endsAt)}
					/>
					<Field
						label="Location or online meeting"
						name="location"
						required
						maxLength={200}
						defaultValue={selected?.location}
					/>
					<Field
						label="Event website, optional"
						name="eventUrl"
						type="url"
						pattern="https://.*"
						maxLength={2000}
						defaultValue={selected?.eventUrl || ''}
						hint="Use an HTTPS address. Demo events do not show registration links."
					/>
					<Field label="Status">
						<select name="status" defaultValue={selected?.status || 'DRAFT'}>
							<option value="DRAFT">Draft</option>
							<option value="PUBLISHED">Published</option>
							<option value="ARCHIVED">Archived</option>
						</select>
					</Field>
					<label className="checkbox">
						<input name="isDemo" type="checkbox" defaultChecked={selected?.isDemo ?? false} />
						Fictional demo event
					</label>
					<Feedback {...action} />
					{saved && <Notice>Event saved.</Notice>}
					<Button type="submit" disabled={action.busy}>
						Save event
					</Button>
				</form>
			</div>
		</>
	);
}
