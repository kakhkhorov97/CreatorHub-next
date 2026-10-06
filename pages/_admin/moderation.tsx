import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useMutation, useQuery } from '@apollo/client';
import { useState } from 'react';
import { toast } from 'sonner';
import { adminDecideContentReview } from '../../apollo/admin/mutation';
import { adminContentReviews } from '../../apollo/admin/query';
import AdminLayout from '../../libs/components/admin/AdminLayout';
import { Button, Empty, Field, Heading, QueryState, Status, Notice } from '../../libs/components/common/UI';
import ReviewPreview from '../../libs/components/review/ReviewPreview';
import { ContentReview } from '../../libs/types/creatorhub';

export default function Moderation() {
	const { t: translate } = useSiteTranslation('common');

	const [status, setStatus] = useState('PENDING');
	const [reasons, setReasons] = useState<Record<string, string>>({});
	const [errorMessage, setErrorMessage] = useState('');
	const [pending, setPending] = useState('');
	const queue = useQuery<{ adminContentReviews: ContentReview[] }>(adminContentReviews, {
		variables: { status },
		fetchPolicy: 'network-only',
		pollInterval: 15000,
	});
	const [decide] = useMutation(adminDecideContentReview);

	async function review(item: ContentReview, approve: boolean) {
		if (pending) return;
		setPending(item._id);
		setErrorMessage('');
		try {
			await decide({
				variables: {
					id: item._id,
					approve,
					revision: item.updatedAt,
					reason: approve ? undefined : reasons[item._id]?.trim(),
				},
			});
			toast.success(approve ? 'Submission approved.' : 'Submission rejected.');
			await queue.refetch();
		} catch (error) {
			setErrorMessage(error instanceof Error ? error.message : 'Unable to review. Refresh and try again.');
		} finally {
			setPending('');
		}
	}
	return (
		<AdminLayout title={translate('Content approval')}>
			<Heading title={translate('Content approval')} />
			{errorMessage && <Notice error>{errorMessage}</Notice>}
			<p>{translate('Review all submitted text and media before approval. Explicit sexual content is prohibited.')}</p>
			<Field label={translate('Review status')}>
				<select value={status} onChange={(event) => setStatus(event.target.value)}>
					{['PENDING', 'APPROVED', 'REJECTED'].map((value) => (
						<option key={value}>{value}</option>
					))}
				</select>
			</Field>
			<QueryState loading={queue.loading && !queue.data} error={queue.error} retry={() => queue.refetch()} />
			{!queue.loading && !queue.error && !queue.data?.adminContentReviews.length && (
				<Empty title={translate('No submissions here')} />
			)}
			{queue.data?.adminContentReviews.map((item) => (
				<article className="panel review-card" key={item._id}>
					<div className="row">
						<h2>{item.title}</h2>
						<Status value={item.status} />
					</div>
					<p>
						{item.kind.toLowerCase()} {translate('· Submitted')}{' '}
						{new Date(item.updatedAt).toLocaleString('en-US', { timeZone: 'Asia/Seoul' })} {translate('KST')}
					</p>
					<p className="muted">
						{translate('Creator account:')} {item.ownerId}
					</p>
					<ReviewPreview review={item} />
					{item.reason && (
						<p>
							{translate('Rejection reason:')} {item.reason}
						</p>
					)}
					{item.status === 'PENDING' && (
						<div className="review-decision">
							<Field
								label={translate('Reason for rejection')}
								value={reasons[item._id] || ''}
								onChange={(event) => setReasons({ ...reasons, [item._id]: event.target.value })}
								maxLength={1000}
							/>
							<div className="actions">
								<Button disabled={!!pending} onClick={() => review(item, true)}>
									{translate('Approve and publish')}
								</Button>
								<Button danger disabled={!!pending || !reasons[item._id]?.trim()} onClick={() => review(item, false)}>
									{translate('Reject')}
								</Button>
							</div>
						</div>
					)}
				</article>
			))}
		</AdminLayout>
	);
}
