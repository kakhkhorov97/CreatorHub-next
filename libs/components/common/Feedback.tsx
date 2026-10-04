import React, { ReactNode, useEffect } from 'react';
import { toast } from 'sonner';

export function Notice({ children, error = false }: { children: ReactNode; error?: boolean }) {
	useEffect(() => {
		if (!error && typeof children === 'string') {
			if (/saved|updated|sent|removed|published|activated|approved|rejected/i.test(children)) toast.success(children);
			else toast.info(children);
		}
	}, [children, error]);
	if (!error && typeof children === 'string') return null;
	return (
		<div role={error ? 'alert' : 'status'} className={`notice ${error ? 'error' : ''}`}>
			{children}
		</div>
	);
}

export function Feedback({ busy, error }: { busy?: boolean; error?: string }) {
	return (
		<>
			{busy && <p role="status">Saving…</p>}
			{error && <Notice error>{error}</Notice>}
		</>
	);
}
