import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { useAction } from '../../hooks/useApi';
import { usePaged } from '../../hooks/usePaged';
import { Button, Confirm, date, Feedback, LinkButton, Pager, QueryState, TextArea } from '../common/UI';

export function Comments({ projectId }: { projectId: string }) {
	const { t: translate } = useSiteTranslation('common');

	const comments = usePaged('getProjectComments', { projectId });
	const user = useReactiveVar(userVar);
	const action = useAction();
	const [content, setContent] = useState('');
	const [edit, setEdit] = useState<string | null>(null);
	const [remove, setRemove] = useState<string | null>(null);
	const key = useRef<string | null>(null);
	return (
		<section className="comments">
			<h2>{translate('Comments')}</h2>
			<QueryState loading={comments.loading} error={comments.error} />
			{comments.rows.map((c) => (
				<article className="comment" key={c._id}>
					<div className="row">
						<strong>{c.userId === user?._id ? translate('You') : translate('Community member')}</strong>
						<time>
							{date(c.createdAt)}
							{c.editedAt ? translate(' · Edited') : ''}
						</time>
					</div>
					<p>{c.content}</p>
					{user?._id === c.userId && (
						<div className="actions">
							<Button
								secondary
								onClick={() => {
									setEdit(c._id);
									setContent(c.content);
								}}
							>
								{translate('Edit')}
							</Button>
							<Button danger secondary onClick={() => setRemove(c._id)}>
								{translate('Delete')}
							</Button>
						</div>
					)}
				</article>
			))}
			{remove && (
				<Confirm
					title={translate('Delete this comment?')}
					onCancel={() => setRemove(null)}
					busy={action.busy}
					onConfirm={() =>
						action.run(async () => {
							await action.mutate('deleteProjectComment', { commentId: remove });
							setRemove(null);
							await comments.refetch();
						})
					}
				>
					{translate('The comment will no longer be visible.')}
				</Confirm>
			)}
			<Pager {...comments} />
			{user ? (
				<form
					onSubmit={(e) => {
						e.preventDefault();
						action.run(async () => {
							if (edit) await action.mutate('editProjectComment', { commentId: edit, input: { content } });
							else {
								key.current ??= crypto.randomUUID();
								await action.mutate('createProjectComment', {
									input: { projectId, clientCommentKey: key.current, content },
								});
							}
							key.current = null;
							setContent('');
							setEdit(null);
							await comments.refetch();
						});
					}}
				>
					<TextArea
						label={edit ? translate('Edit comment') : translate('Add a comment')}
						required
						minLength={1}
						maxLength={2000}
						value={content}
						onChange={(e) => {
							setContent(e.target.value);
							key.current = null;
						}}
					/>
					<div className="actions">
						<Button type="submit" disabled={action.busy}>
							{edit ? translate('Save comment') : translate('Post comment')}
						</Button>
						{edit && (
							<Button
								secondary
								onClick={() => {
									setEdit(null);
									setContent('');
								}}
							>
								{translate('Cancel edit')}
							</Button>
						)}
					</div>
					<Feedback {...action} />
				</form>
			) : (
				<LinkButton secondary href={`/account/sign-in?returnTo=/projects/${projectId}`}>
					{translate('Sign in to comment')}
				</LinkButton>
			)}
		</section>
	);
}
