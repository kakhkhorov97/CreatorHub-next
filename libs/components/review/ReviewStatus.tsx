import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useApi } from '../../hooks/useApi';
import { Status } from '../common/UI';
import ReviewPreview from './ReviewPreview';

export default function ReviewStatus({
	kind,
	targetId,
}: {
	kind: 'PROFILE' | 'PROJECT' | 'SERVICE';
	targetId?: string;
}) {
	const { t: translate } = useSiteTranslation('common');

	const reviews = useApi('myContentReviews', {}, !targetId, 15000);
	const review = reviews.value?.find((item) => item.kind === kind && item.targetId === targetId);
	if (!review) return null;
	return (
		<section className="review-status" aria-live="polite">
			<h3>{translate('Admin review')}</h3>
			<Status value={review.status} />
			<p>
				{review.status === 'PENDING'
					? translate('Your submission is waiting for admin approval. The approved version, if any, stays public.')
					: review.status === 'REJECTED'
					? review.reason
					: translate('Your submission has been approved.')}
			</p>
			{review.status !== 'APPROVED' && (
				<details>
					<summary>{translate('View your submitted changes')}</summary>
					<ReviewPreview review={review} />
				</details>
			)}
			<p>
				<small>
					{translate('Save your edits before submitting again. Editing a pending draft requires resubmission.')}
				</small>
			</p>
		</section>
	);
}
