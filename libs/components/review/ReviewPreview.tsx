import { ContentReview } from '../../types/creatorhub';
import { label, Picture, safeUrl } from '../common/UI';

export default function ReviewPreview({ review }: { review: ContentReview }) {
	let snapshot: Record<string, unknown> = {};
	try {
		snapshot = JSON.parse(review.preview);
	} catch {
		return <p>Preview unavailable. Refresh the queue before reviewing.</p>;
	}
	return (
		<div className="review-preview">
			{Object.entries(snapshot)
				.filter(([key, value]) => key !== 'media' && value != null)
				.map(([key, value]) => (
					<div key={key}>
						<strong>{label(key.replace(/([A-Z])/g, ' $1'))}</strong>
						{key === 'coverImageUrl' ? (
							<>
								<Picture src={String(value)} alt="Submitted cover" />
								<a href={safeUrl(String(value))} target="_blank" rel="noreferrer">
									Open cover
								</a>
							</>
						) : (
							<p>
								{Array.isArray(value)
									? value.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(', ')
									: String(value)}
							</p>
						)}
					</div>
				))}
			{Array.isArray(snapshot.media) &&
				snapshot.media.map((item: { type: string; url: string; altText?: string }, index: number) => (
					<div key={index}>
						{item.type === 'IMAGE' ? (
							<Picture src={item.url} alt={item.altText || 'Submitted image'} />
						) : (
							<a href={safeUrl(item.url)} target="_blank" rel="noreferrer">
								Open submitted video
							</a>
						)}
						<p>{item.altText}</p>
					</div>
				))}
		</div>
	);
}
