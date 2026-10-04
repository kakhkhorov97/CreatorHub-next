import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useAction, useApi } from '../../hooks/useApi';
import { Inquiry } from '../../types/creatorhub';
import {
	Button,
	Confirm,
	date,
	Feedback,
	Field,
	Heading,
	money,
	Notice,
	optional,
	TextArea,
	values,
} from '../common/UI';

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
	const [review, setReview] = useState(false);
	const [remove, setRemove] = useState(false);
	const [message, setMessage] = useState('');
	const services = useApi('getServices', { input: { creatorId, limit: 50 } }, !creatorId);
	const version = inquiry ? { inquiryId: inquiry._id, expectedVersion: inquiry.version } : undefined;
	return (
		<>
			<Heading title={review ? 'Review your inquiry' : inquiry ? 'Edit inquiry draft' : 'New inquiry'} />
			{!creatorId ? (
				<Notice error>
					Choose a creator or service before starting an inquiry.{' '}
					<Link passHref href="/creators">
						Browse creators
					</Link>
				</Notice>
			) : (
				<div className="editor-layout">
					<section className="panel">
						{review && inquiry ? (
							<>
								<h2>{inquiry.subject || 'Untitled inquiry'}</h2>
								<p className="prose-text">{inquiry.brief}</p>
								<dl>
									<dt>Budget</dt>
									<dd>
										{money(inquiry.budgetMin)} – {money(inquiry.budgetMax)}
									</dd>
									<dt>Submitted</dt>
									<dd>{date(inquiry.submittedAt)}</dd>
									<dt>Desired deadline</dt>
									<dd>{date(inquiry.desiredDeadline)}</dd>
									<dt>Service</dt>
									<dd>{services.value?.find((s) => s._id === inquiry.serviceId)?.title || 'General inquiry'}</dd>
								</dl>
								<Notice>Only you and the creator can see this inquiry. You cannot edit the brief after sending.</Notice>
								<div className="actions">
									<Button
										disabled={action.busy}
										onClick={() =>
											action.run(async () => {
												await action.mutate('submitInquiry', { input: version! });
												setReview(false);
												await refresh?.();
											})
										}
									>
										Send inquiry
									</Button>
									<Button secondary onClick={() => setReview(false)}>
										Back to draft
									</Button>
								</div>
							</>
						) : (
							<form
								onSubmit={(e) => {
									e.preventDefault();
									const f = values(e.currentTarget);
									action.run(async () => {
										if (f.budgetMin && f.budgetMax && Number(f.budgetMin) > Number(f.budgetMax))
											throw new Error('Maximum budget must not be below minimum budget.');
										const fields = {
											subject: optional(f.subject),
											brief: optional(f.brief),
											serviceId: optional(f.serviceId),
											budgetMin: f.budgetMin ? Number(f.budgetMin) : undefined,
											budgetMax: f.budgetMax ? Number(f.budgetMax) : undefined,
											desiredDeadline: f.desiredDeadline
												? new Date(f.desiredDeadline + 'T00:00:00+09:00').toISOString()
												: undefined,
										};
										const saved = inquiry
											? await action.mutate('updateInquiry', {
													input: { ...version!, ...fields, clearService: !!inquiry.serviceId && !f.serviceId },
											  })
											: await action.mutate('createInquiry', { input: { creatorId, ...fields } });
										setMessage('Draft saved.');
										if (!inquiry) await router.replace(`/inquiries/${saved._id}`);
										else await refresh?.();
									});
								}}
							>
								<Field label="Subject" name="subject" maxLength={150} defaultValue={inquiry?.subject || ''} />
								<TextArea
									label="Project brief"
									name="brief"
									minLength={20}
									maxLength={10000}
									rows={9}
									defaultValue={inquiry?.brief || ''}
								/>
								<small>Use 20–10,000 characters when adding a brief.</small>
								<Field label="Selected service">
									<select name="serviceId" value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
										<option value="">General inquiry</option>
										{services.value?.map((s) => (
											<option key={s._id} value={s._id}>
												{s.title}
											</option>
										))}
										{serviceId && !services.value?.some((s) => s._id === serviceId) && (
											<option value={serviceId}>Previously selected service</option>
										)}
									</select>
								</Field>
								<div className="form-grid">
									<Field
										label="Minimum budget, KRW"
										name="budgetMin"
										type="number"
										min={0}
										max={1000000000}
										defaultValue={inquiry?.budgetMin ?? ''}
									/>
									<Field
										label="Maximum budget, KRW"
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
								<div className="actions">
									<Button type="submit" disabled={action.busy}>
										Save draft
									</Button>
									{inquiry && (
										<Button secondary disabled={action.busy} onClick={() => setReview(true)}>
											Review saved draft
										</Button>
									)}
								</div>
							</form>
						)}
						<Feedback {...action} />
						{message && <Notice>{message}</Notice>}
						{action.error && inquiry && (
							<Button
								secondary
								onClick={() =>
									action.run(async () => {
										await refresh?.();
										setMessage('Latest version loaded. Review your draft before saving again.');
									})
								}
							>
								Refresh latest version
							</Button>
						)}
					</section>
					<aside className="panel publishing">
						<h2>Before you send</h2>
						<p>Save your draft, then review the brief, budget, and selected service.</p>
						<p>The creator will see this inquiry only after you send it.</p>
						{inquiry && (
							<Button secondary onClick={() => setRemove(true)}>
								Delete draft
							</Button>
						)}
					</aside>
				</div>
			)}
			{remove && (
				<Confirm
					title="Delete this draft?"
					busy={action.busy}
					onCancel={() => setRemove(false)}
					onConfirm={() =>
						action.run(async () => {
							await action.mutate('deleteInquiryDraft', { input: version! });
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
