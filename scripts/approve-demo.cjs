// Only for the guarded disposable demo/test workflows. Real submissions need a human review.
async function approveDemoSubmission(op, ownerToken, adminToken) {
	const reviews = await op('myContentReviews', {}, ownerToken);
	const queue = await op('adminContentReviews', { status: 'PENDING' }, adminToken);
	for (const review of reviews.filter((item) => item.status === 'PENDING')) {
		if (!queue.some((item) => item._id === review._id)) throw new Error('Demo submission missing from admin queue');
		await op('adminDecideContentReview', { id: review._id, approve: true, revision: review.updatedAt }, adminToken);
	}
}
module.exports = { approveDemoSubmission };
