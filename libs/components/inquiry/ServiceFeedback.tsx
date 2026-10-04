import { Star } from 'phosphor-react';
import { useState } from 'react';
import { useAction, useApi } from '../../hooks/useApi';
import { Inquiry } from '../../types/creatorhub';
import { Button, Confirm, date, Feedback, Field, QueryState, TextArea, values } from '../common/UI';

export function EngagementFeedback({
	inquiry,
	isClient,
	refresh,
}: {
	inquiry: Inquiry;
	isClient: boolean;
	refresh: () => Promise<unknown>;
}) {
	const existing = useApi('getInquiryFeedback', { inquiryId: inquiry._id });
	const action = useAction();
	const [complete, setComplete] = useState(false);
	if (inquiry.status !== 'CLOSED') return null;
	return (
		<section className="panel engagement-feedback">
			<h2>Service feedback</h2>
			<QueryState loading={existing.loading} error={existing.error} retry={() => existing.refetch()} />
			{existing.value ? (
				<>
					<Rating value={existing.value.rating} />
					<p className="prose-text">{existing.value.feedback}</p>
					<small>
						{existing.value.authorName} · {date(existing.value.createdAt)}
					</small>
				</>
			) : isClient && inquiry.outcome === 'COMPLETED' && !existing.loading && !existing.error ? (
				<form
					onSubmit={(event) => {
						event.preventDefault();
						const f = values(event.currentTarget);
						action.run(async () => {
							await action.mutate('createServiceFeedback', {
								input: { inquiryId: inquiry._id, rating: Number(f.rating), feedback: f.feedback },
							});
							await existing.refetch();
							await refresh();
						});
					}}
				>
					<p>How was the completed work? Your rating and feedback will appear on the creator’s profile.</p>
					<Field label="Rating">
						<select name="rating" required defaultValue="">
							<option value="" disabled>
								Choose a rating
							</option>
							{[5, 4, 3, 2, 1].map((n) => (
								<option key={n} value={n}>
									{n} {n === 1 ? 'star' : 'stars'}
								</option>
							))}
						</select>
					</Field>
					<TextArea label="Your feedback" name="feedback" required maxLength={2000} rows={3} />
					<Button type="submit" disabled={action.busy}>
						Post review
					</Button>
				</form>
			) : isClient && inquiry.outcome === 'AGREED_TO_PROCEED' ? (
				<>
					<p>When the agreed work is finished, mark it completed to leave a review.</p>
					<Button disabled={action.busy} onClick={() => setComplete(true)}>
						Mark work completed
					</Button>
				</>
			) : (
				<p className="muted">Feedback is available after the customer confirms that the work is completed.</p>
			)}
			<Feedback error={action.error} />
			{complete && (
				<Confirm
					title="Is the work completed?"
					danger={false}
					busy={action.busy}
					onCancel={() => setComplete(false)}
					onConfirm={() =>
						action.run(async () => {
							await action.mutate('completeInquiry', {
								input: { inquiryId: inquiry._id, expectedVersion: inquiry.version },
							});
							setComplete(false);
							await refresh();
						})
					}
				>
					Confirm once you have received the completed work. You can then leave your review.
				</Confirm>
			)}
		</section>
	);
}

export function Rating({ value }: { value: number }) {
	return (
		<span className="review-rating" aria-label={`${value} out of 5 stars`}>
			{[1, 2, 3, 4, 5].map((n) => (
				<Star key={n} size={18} weight={n <= value ? 'fill' : 'regular'} aria-hidden="true" />
			))}
			<span>{value}/5</span>
		</span>
	);
}
