import { useTranslation as useSiteTranslation } from 'next-i18next';
import { ImageSquare, UserCircle } from 'phosphor-react';
import React, { useEffect, useState } from 'react';
import { mediaUrl } from '../../utils/format';
import { responsiveImage } from '../../utils/image';

export function Picture({
	src,
	alt = '',
	avatar = false,
	sizes,
}: {
	src?: string | null;
	alt?: string;
	avatar?: boolean;
	// How wide the image shows, so the browser picks a small file. Defaults suit grid cards.
	sizes?: string;
}) {
	const { t: translate } = useSiteTranslation('common');

	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [src]);
	const valid = mediaUrl(src);
	return valid && !failed ? (
		<img
			className={avatar ? 'avatar' : 'picture'}
			{...responsiveImage(valid, avatar)}
			sizes={sizes || (avatar ? '64px' : '(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw')}
			alt={alt}
			decoding="async"
			loading="lazy"
			onError={() => setFailed(true)}
		/>
	) : (
		<span
			className={avatar ? 'avatar placeholder' : 'picture placeholder'}
			role="img"
			aria-label={alt || translate('No image')}
		>
			{avatar ? <UserCircle size={32} /> : <ImageSquare size={40} />}
		</span>
	);
}
