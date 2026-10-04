import Link from 'next/link';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { useAction, useApi } from '../../hooks/useApi';
import { useCreatorDirectory } from '../../hooks/useCreatorDirectory';
import { Inquiry } from '../../types/creatorhub';
import { Button, Confirm, Feedback, Field, Heading, Notice, optional, TextArea, values } from '../common/UI';

// Retained drafts can still be sent or removed. New inquiries are sent in one transaction.
export function Draft({
	inquiry,
	creatorId,
	serviceId,
	refresh,
}: {
	inquiry?: Inquiry;
	creatorId: string;
	serviceId?: string;
	refresh?: () => Promise<unknown>;
}) {
	const action = useAction();
	const router = useRouter();
	const [selectedService, setSelectedService] = useState(serviceId || '');
	const [remove, setRemove] = useState(false);
	const requestKey = useRef<string>('');
	const draftVersion = useRef(inquiry?.version || 0);
	const directory = useCreatorDirectory([creatorId]);
	const creator = directory[creatorId];
	const services = useApi('getServices', { input: { creatorId, limit: 50 } }, !creatorId);
	return (
		<>
			<Heading title="Send an inquiry" />
			{!creatorId ? (
				<Notice error>
					Choose a creator or service first. <Link href="/creators">Browse creators</Link>
				</Notice>
			) : (
				<div className="editor-layout">
					<section className="panel">
						{creator && (
							<p className="inquiry-recipient">
								To{' '}
								<a href={`/creators/${creator.slug}`} target="_blank" rel="noreferrer">
									{creator.identity.displayName} · View profile
								</a>
							</p>
						)}
						<form
							onSubmit={(event) => {
								event.preventDefault();
								const f = values(event.currentTarget);
								action.run(async () => {
									if (f.budgetMin && f.budgetMax && Number(f.budgetMin) > Number(f.budgetMax))
										throw new Error('Maximum budget must not be below minimum budget.');
									const fields = {
										subject: f.subject.trim(),
										brief: f.brief.trim(),
										serviceId: optional(f.serviceId),
										budgetMin: f.budgetMin ? Number(f.budgetMin) : undefined,
										budgetMax: f.budgetMax ? Number(f.budgetMax) : undefined,
										desiredDeadline: f.desiredDeadline
											? new Date(f.desiredDeadline + 'T00:00:00+09:00').toISOString()
											: undefined,
									};
									let sent: Inquiry;
									if (inquiry) {
										const saved = await action.mutate('updateInquiry', {
											input: {
												inquiryId: inquiry._id,
												expectedVersion: draftVersion.current,
												...fields,
												clearService: !!inquiry.serviceId && !f.serviceId,
											},
										});
										draftVersion.current = saved.version;
										sent = await action.mutate('submitInquiry', {
											input: { inquiryId: saved._id, expectedVersion: saved.version },
										});
									} else {
										if (!requestKey.current) requestKey.current = crypto.randomUUID();
										sent = await action.mutate('sendInquiry', {
											input: { creatorId, ...fields, clientRequestKey: requestKey.current },
										});
									}
									await router.replace(`/inquiries/${sent._id}`);
									await refresh?.();
								});
							}}
						>
							<Field label="Subject" name="subject" required maxLength={150} defaultValue={inquiry?.subject || ''} />
							<TextArea
								label="Project brief"
								name="brief"
								required
								minLength={20}
								maxLength={10000}
								rows={7}
								defaultValue={inquiry?.brief || ''}
							/>
							<Field label="Service">
								<select
									name="serviceId"
									value={selectedService}
									onChange={(event) => setSelectedService(event.target.value)}
								>
									<option value="">General inquiry</option>
									{services.value?.map((service) => (
										<option key={service._id} value={service._id}>
											{service.title}
										</option>
									))}
								</select>
							</Field>
							<div className="form-row">
								<Field
									label="Minimum budget (KRW)"
									name="budgetMin"
									type="number"
									min={0}
									max={1000000000}
									defaultValue={inquiry?.budgetMin ?? ''}
								/>
								<Field
									label="Maximum budget (KRW)"
									name="budgetMax"
									type="number"
									min={0}
									max={1000000000}
									defaultValue={inquiry?.budgetMax ?? ''}
								/>
							</div>
							<Field
								label="Desired deadline"
								name="desiredDeadline"
								type="date"
								defaultValue={inquiry?.desiredDeadline?.slice(0, 10) || ''}
							/>
							<Feedback error={action.error} />
							<Button type="submit" disabled={action.busy}>
								{action.busy ? 'Sending…' : 'Send inquiry'}
							</Button>
						</form>
					</section>
					<aside className="panel publishing">
						<h2>Contact the creator</h2>
						<p>Your inquiry goes directly to their private inbox. You cannot edit the brief after sending.</p>
						{creator && (
							<a href={`/creators/${creator.slug}`} target="_blank" rel="noreferrer">
								View creator profile in a new tab
							</a>
						)}
						{inquiry && (
							<Button danger disabled={action.busy} onClick={() => setRemove(true)}>
								Delete draft
							</Button>
						)}
					</aside>
				</div>
			)}
			{remove && inquiry && (
				<Confirm
					title="Delete this draft?"
					busy={action.busy}
					onCancel={() => setRemove(false)}
					onConfirm={() =>
						action.run(async () => {
							await action.mutate('deleteInquiryDraft', {
								input: { inquiryId: inquiry._id, expectedVersion: draftVersion.current },
							});
							await router.push('/inquiries');
						})
					}
				>
					The unsent inquiry will be removed.
				</Confirm>
			)}
		</>
	);
}
