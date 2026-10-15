import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { useRef, useState } from 'react';
import { PencilSimple, Trash } from 'phosphor-react';
import { userVar } from '../../../apollo/store';
import { useAction } from '../../hooks/useApi';
import { usePaged } from '../../hooks/usePaged';
import { Button, Confirm, date, Feedback, LinkButton, Pager, QueryState, TextArea } from '../common/UI';
import { FieldErrors, useFormValidation } from '../../hooks/useFormValidation';

export function Comments({ projectId }: { projectId: string }) {
	const { t: translate } = useSiteTranslation('common');
	const validation = useFormValidation();

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
					<div className="comment-header">
						<div className="comment-meta">
							<strong>{c.userId === user?._id ? translate('You') : translate('Community member')}</strong>
							<time>
								{date(c.createdAt)}
								{c.editedAt ? translate(' · Edited') : ''}
							</time>
						</div>
						{user?._id === c.userId && (
							<div className="comment-actions">
								<Button
									className="icon-button"
									aria-label={translate('Edit comment')}
									title={translate('Edit comment')}
									disabled={action.busy}
									onClick={() => {
										setEdit(c._id);
										setContent(c.content);
									}}
								>
									<PencilSimple size={19} aria-hidden="true" />
								</Button>
								<Button
									className="icon-button delete-comment"
									aria-label={translate('Delete comment')}
									title={translate('Delete comment')}
									disabled={action.busy}
									onClick={() => setRemove(c._id)}
								>
									<Trash size={19} aria-hidden="true" />
								</Button>
							</div>
						)}
					</div>
					<p>{c.content}</p>
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
					{...validation.form}
					onSubmit={(e) => {
						e.preventDefault();
						if (!validation.validate(e.currentTarget)) return;
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
					<FieldErrors value={validation.errors}>
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
							<Button type="submit" disabled={action.busy || !content.trim()}>
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
					</FieldErrors>
				</form>
			) : (
				<LinkButton secondary href={`/account/sign-in?returnTo=/projects/${projectId}`}>
					{translate('Sign in to comment')}
				</LinkButton>
			)}
		</section>
	);
}
