import { useTranslation as useSiteTranslation } from 'next-i18next';
import { CircleNotch } from 'phosphor-react';
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
				// The text doubles as the id, so a repeated effect updates one toast instead of stacking two.
				toast.success(content as string, { id: content as string });
			else toast.info(content as string, { id: content as string });
		}
	}, [children, content, error, notify]);
	if (notify && !error && typeof children === 'string') return null;
	return (
		<div role={error ? 'alert' : 'status'} className={`notice ${error ? 'error' : ''}`}>
			{content}
		</div>
	);
}

export function Feedback({
	busy,
	error,
	busyLabel = 'Saving…',
}: {
	busy?: boolean;
	error?: string;
	busyLabel?: string;
}) {
	const { t: translate } = useSiteTranslation('common');

	return (
		<>
			{busy && (
				<p className="saving-feedback" role="status">
					<CircleNotch className="button-spinner" size={23} aria-hidden />
					{translate(busyLabel)}
				</p>
			)}
			{error && <Notice error>{translate(error)}</Notice>}
		</>
	);
}
