import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useReactiveVar } from '@apollo/client';
import { useEffect, useRef, useState } from 'react';
import { userVar } from '../../../apollo/store';
import { useAction } from '../../hooks/useApi';
import { toast } from 'sonner';
import { Button, Feedback, Notice, Picture } from '../common/UI';

export function AvatarUpload() {
	const { t: translate } = useSiteTranslation('common');

	const user = useReactiveVar(userVar)!;
	const action = useAction();
	const input = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState('');
	const [saved, setSaved] = useState(false);

	useEffect(() => {
		return () => {
			if (preview) URL.revokeObjectURL(preview);
		};
	}, [preview]);

	return (
		<div className="avatar-upload">
			<div className="avatar-upload-controls">
				{preview ? (
					<img className="avatar" src={preview} alt="Selected profile photo" />
				) : (
					<Picture avatar src={user.avatarUrl} alt="Your profile photo" />
				)}
				<div>
					<div className="avatar-upload-buttons">
						<Button secondary disabled={action.busy} onClick={() => input.current?.click()}>
							{action.busy ? translate('Uploading…') : translate('Upload photo')}
						</Button>
						{user.avatarUrl && !preview && (
							<Button
								secondary
								danger
								disabled={action.busy}
								onClick={() =>
									action.run(async () => {
										setSaved(false);
										userVar(await action.mutate('removeMyAvatar'));
										toast.success(translate('Profile photo removed.'));
									})
								}
							>
								{translate('Remove photo')}
							</Button>
						)}
					</div>
					<p className="muted">{translate('JPG, PNG or WebP. Up to 10 MB.')}</p>
				</div>
			</div>
			<input
				ref={input}
				type="file"
				accept="image/jpeg,image/png,image/webp"
				aria-label={translate('Choose profile photo')}
				hidden
				disabled={action.busy}
				onChange={(event) => {
					const file = event.target.files?.[0];
					event.target.value = '';
					if (!file) return;
					setSaved(false);
					action.setError('');
					if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 10_000_000) {
						action.setError('Choose a JPG, PNG or WebP image up to 10 MB.');
						return;
					}
					setPreview(URL.createObjectURL(file));
					action.run(async () => {
						const avatarUrl = await action.mutate('imageUploader', { file, target: 'avatar' });
						const updated = await action.mutate('updateMe', { input: { avatarUrl } });
						userVar(updated);
						setPreview('');
						setSaved(true);
					});
				}}
			/>
			<Feedback {...action} />
			{saved && <Notice>{translate('Profile photo updated.')}</Notice>}
		</div>
	);
}
