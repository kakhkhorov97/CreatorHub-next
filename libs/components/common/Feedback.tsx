import { useTranslation as useSiteTranslation } from 'next-i18next';
import React, { ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

export function Notice({
	children,
	error = false,
	notify = false,
}: {
	children: ReactNode;
	error?: boolean;
	notify?: boolean;
}) {
	const { t: translate } = useSiteTranslation('common');
	const content = typeof children === 'string' ? translate(children) : children;
	useEffect(() => {
		if (notify && !error && typeof children === 'string') {
			if (
				/saved|updated|sent|removed|published|activated|approved|rejected|submitted|created|added|verified|changed/i.test(
					children,
				)
			)
				toast.success(content as string);
			else toast.info(content as string);
		}
	}, [children, content, error, notify]);
	if (notify && !error && typeof children === 'string') return null;
	return (
		<div role={error ? 'alert' : 'status'} className={`notice ${error ? 'error' : ''}`}>
			{content}
		</div>
	);
}

export function Feedback({ busy, error }: { busy?: boolean; error?: string }) {
	const { t: translate } = useSiteTranslation('common');

	return (
		<>
			{busy && <p role="status">{translate('Saving…')}</p>}
			{error && <Notice error>{translate(error)}</Notice>}
		</>
	);
}
