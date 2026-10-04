import { useApi } from '../../hooks/useApi';
import { Status } from '../common/UI';

export default function ReviewStatus({
	kind,
	targetId,
}: {
	kind: 'PROFILE' | 'PROJECT' | 'SERVICE';
	targetId?: string;
}) {
	const reviews = useApi('myContentReviews', {}, !targetId, 15000);
	const review = reviews.value?.find((item) => item.kind === kind && item.targetId === targetId);
	if (!review) return null;
	return (
		<section className="review-status" aria-live="polite">
			<h3>Admin review</h3>
			<Status value={review.status} />
			<p>
				{review.status === 'PENDING'
					? 'Your submission is waiting for admin approval. The approved version, if any, stays public.'
					: review.status === 'REJECTED'
					? review.reason
					: 'Your submission has been approved.'}
			</p>
			{review.status !== 'APPROVED' && (
				<details>
					<summary>View your submitted changes</summary>
					<pre>{review.preview}</pre>
				</details>
			)}
			<p>
				<small>Save your edits before submitting again. Editing a pending draft requires resubmission.</small>
			</p>
		</section>
	);
}
