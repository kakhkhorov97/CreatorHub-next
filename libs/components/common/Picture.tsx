import { useTranslation as useSiteTranslation } from 'next-i18next';
import { ImageSquare, UserCircle } from 'phosphor-react';
import React, { useEffect, useState } from 'react';
import { safeUrl } from '../../utils/format';

export function Picture({ src, alt = '', avatar = false }: { src?: string | null; alt?: string; avatar?: boolean }) {
	const { t: translate } = useSiteTranslation('common');

	const [failed, setFailed] = useState(false);
	useEffect(() => setFailed(false), [src]);
	const valid = src && /^\/demo-media\/[a-z0-9-]+\.(?:svg|png|jpg|webp)$/.test(src) ? src : safeUrl(src);
	return valid && !failed ? (
		<img
			className={avatar ? 'avatar' : 'picture'}
			src={valid}
			alt={alt}
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
