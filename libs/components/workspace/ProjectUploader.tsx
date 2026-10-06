import { useTranslation as useSiteTranslation } from 'next-i18next';
import { useEffect, useRef, useState } from 'react';
import { useAction } from '../../hooks/useApi';
import { PortfolioMediaInput } from '../../types/creatorhub';
import { Button, Feedback } from '../common/UI';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const mediaTypes = [...imageTypes, 'video/mp4', 'video/webm'];

export default function ProjectUploader({
	cover = false,
	remaining = 20,
	disabled = false,
	onBusy,
	onUploaded,
}: {
	cover?: boolean;
	remaining?: number;
	disabled?: boolean;
	onBusy: (busy: boolean) => void;
	onUploaded: (media: PortfolioMediaInput[]) => void;
}) {
	const { t: translate } = useSiteTranslation('common');

	const action = useAction();
	const input = useRef<HTMLInputElement>(null);
	const [previews, setPreviews] = useState<Array<{ url: string; name: string; video: boolean }>>([]);
	useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews]);
	return (
		<div className="project-uploader">
			<Button secondary disabled={disabled || action.busy || remaining <= 0} onClick={() => input.current?.click()}>
				{action.busy
					? translate('Uploading…')
					: cover
					? translate('Upload cover image')
					: translate('Upload project files')}
			</Button>
			<p className="muted">
				{cover
					? translate('JPG, PNG or WebP. Up to 10 MB.')
					: translate('JPG, PNG, WebP, MP4 or WebM. Up to 10 MB per file; ten files per upload.')}
			</p>
			<input
				ref={input}
				type="file"
				hidden
				multiple={!cover}
				accept={(cover ? imageTypes : mediaTypes).join(',')}
				aria-label={cover ? translate('Choose cover image') : translate('Choose project files')}
				onChange={(event) => {
					const files = Array.from(event.target.files || []);
					event.target.value = '';
					if (!files.length) return;
					if (files.length > Math.min(cover ? 1 : 10, remaining)) {
						action.setError('Choose up to ten files without exceeding the project limit of twenty media items.');
						return;
					}
					if (
						files.some(
							(file) => !(cover ? imageTypes : mediaTypes).includes(file.type) || !file.size || file.size > 10_000_000,
						)
					) {
						action.setError('Choose a supported image or video up to 10 MB per file.');
						return;
					}
					setPreviews(
						files.map((file) => ({
							url: URL.createObjectURL(file),
							name: file.name,
							video: file.type.startsWith('video/'),
						})),
					);
					onBusy(true);
					action.run(async () => {
						try {
							const urls = await action.mutate('imagesUploader', { files, target: 'project' });
							onUploaded(
								urls.map((url, index) => ({
									url,
									type: files[index].type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
									altText: '',
									sortOrder: index,
								})),
							);
							setPreviews([]);
						} finally {
							onBusy(false);
						}
					});
				}}
			/>
			<div className="upload-previews">
				{previews.map((item) => (
					<figure key={item.url}>
						{item.video ? <video src={item.url} controls preload="metadata" /> : <img src={item.url} alt={item.name} />}
						<figcaption>{item.name}</figcaption>
					</figure>
				))}
			</div>
			<Feedback {...action} />
		</div>
	);
}
