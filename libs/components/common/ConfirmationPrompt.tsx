import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function ConfirmationPrompt({
	children,
	onCancel,
	busy = false,
}: {
	children: ReactNode;
	onCancel: () => void;
	busy?: boolean;
}) {
	const [mounted, setMounted] = useState(false);
	const panel = useRef<HTMLElement>(null);
	const cancel = useRef(onCancel);
	cancel.current = onCancel;
	useEffect(() => {
		setMounted(true);
	}, []);
	useEffect(() => {
		if (!mounted) return;
		const previous = document.activeElement as HTMLElement | null;
		const background = Array.from(document.body.children).filter((element) => element !== panel.current);
		const wasInert = background.map((element) => element.hasAttribute('inert'));
		background.forEach((element) => element.setAttribute('inert', ''));
		panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
		return () => {
			background.forEach((element, index) => {
				if (!wasInert[index]) element.removeAttribute('inert');
			});
			previous?.focus();
		};
	}, [mounted]);
	if (!mounted) return null;
	return createPortal(
		<section
			ref={panel}
			className="confirm confirmation-prompt"
			role="alertdialog"
			aria-modal="true"
			aria-label="Confirm action"
			onKeyDown={(event) => {
				if (event.key === 'Escape' && !busy) {
					event.preventDefault();
					cancel.current();
				}
				if (event.key === 'Tab') {
					const controls = Array.from(
						panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), select, input, a[href]') || [],
					);
					const first = controls[0],
						last = controls[controls.length - 1];
					if (event.shiftKey && document.activeElement === first) {
						event.preventDefault();
						last?.focus();
					} else if (!event.shiftKey && document.activeElement === last) {
						event.preventDefault();
						first?.focus();
					}
				}
			}}
		>
			{children}
		</section>,
		document.body,
	);
}
