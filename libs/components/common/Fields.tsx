import { useTranslation as useSiteTranslation } from 'next-i18next';
import { Eye, EyeSlash } from 'phosphor-react';
import React, { ReactNode, useId, useState } from 'react';
import { handleMessageKey } from '../../utils/messageKeyboard';

export function Field({
	label: text,
	hint,
	children,
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; children?: ReactNode }) {
	const { t: translate } = useSiteTranslation('common');
	const id = useId();
	return (
		<label className="field" htmlFor={id}>
			<span>{translate(text)}</span>
			{React.isValidElement(children) ? (
				React.cloneElement(children as React.ReactElement<{ id?: string; 'aria-describedby'?: string }>, {
					id,
					'aria-describedby': hint ? `${id}-hint` : undefined,
				})
			) : (
				<input
					id={id}
					aria-describedby={hint ? `${id}-hint` : undefined}
					{...props}
					onKeyDown={(event) => {
						props.onKeyDown?.(event);
						if (
							!event.defaultPrevented &&
							['text', 'email', 'password', 'tel', 'url', 'search', 'number'].includes(props.type || 'text')
						)
							handleMessageKey(event, !props.disabled);
					}}
				/>
			)}
			{hint && <small id={`${id}-hint`}>{translate(hint)}</small>}
		</label>
	);
}

export function TextArea({
	label: text,
	...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
	const { t: translate } = useSiteTranslation('common');
	const id = useId();
	return (
		<label className="field" htmlFor={id}>
			<span>{translate(text)}</span>
			<textarea
				id={id}
				{...props}
				aria-describedby={props['aria-describedby'] || `${id}-shortcut`}
				onKeyDown={(event) => {
					props.onKeyDown?.(event);
					if (!event.defaultPrevented) handleMessageKey(event, !props.disabled);
				}}
			/>
			{!props['aria-describedby'] && (
				<small id={`${id}-shortcut`}>{translate('Enter to submit. Shift+Enter for a new line.')}</small>
			)}
		</label>
	);
}

export function Password({
	label: text = 'Password',
	showRequirements = true,
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; showRequirements?: boolean }) {
	const { t: translate } = useSiteTranslation('common');

	const [show, setShow] = useState(false);
	const newPassword = props.autoComplete === 'new-password';
	const hint = newPassword && showRequirements;
	const id = useId();
	return (
		<label className="field" htmlFor={id}>
			<span>{translate(text)}</span>
			<span className="password">
				<input
					id={id}
					{...props}
					pattern={
						newPassword ? '(?=[\\s\\S]*\\p{L})(?=[\\s\\S]*[0-9])(?=[\\s\\S]*[^\\p{L}\\p{N}\\s])[\\s\\S]+' : undefined
					}
					aria-describedby={hint ? `${id}-requirements` : props['aria-describedby']}
					onKeyDown={(event) => {
						props.onKeyDown?.(event);
						if (!event.defaultPrevented) handleMessageKey(event, !props.disabled);
					}}
					type={show ? 'text' : 'password'}
				/>
				<button
					type="button"
					aria-label={show ? translate('Hide password') : translate('Show password')}
					title={show ? translate('Hide password') : translate('Show password')}
					onClick={() => setShow((visible) => !visible)}
				>
					{show ? <Eye size={20} aria-hidden="true" /> : <EyeSlash size={20} aria-hidden="true" />}
				</button>
			</span>
			{hint && (
				<small id={`${id}-requirements`}>
					{translate('Use 6–30 characters with a letter, a number, and a symbol. Example: River7!Cloud.')}
				</small>
			)}
		</label>
	);
}
