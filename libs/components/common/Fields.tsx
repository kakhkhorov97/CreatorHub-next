import { useTranslation as useSiteTranslation } from 'next-i18next';
import { Eye, EyeSlash } from 'phosphor-react';
import React, { ReactNode, useId, useState } from 'react';

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
				<input id={id} aria-describedby={hint ? `${id}-hint` : undefined} {...props} />
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
			<textarea id={id} {...props} />
		</label>
	);
}

export function Password({
	label: text = 'Password',
	...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
	const { t: translate } = useSiteTranslation('common');

	const [show, setShow] = useState(false);
	const id = useId();
	return (
		<label className="field" htmlFor={id}>
			<span>{translate(text)}</span>
			<span className="password">
				<input id={id} {...props} type={show ? 'text' : 'password'} />
				<button
					type="button"
					aria-label={show ? translate('Hide password') : translate('Show password')}
					onClick={() => setShow(!show)}
				>
					{show ? <EyeSlash size={20} /> : <Eye size={20} />}
				</button>
			</span>
		</label>
	);
}
