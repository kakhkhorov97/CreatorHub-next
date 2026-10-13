import { CircleNotch } from 'phosphor-react';
import Link from 'next/link';
import React, { ReactNode } from 'react';

export function Button({
	children,
	secondary,
	danger,
	className = '',
	loading = false,
	loadingLabel,
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
	secondary?: boolean;
	danger?: boolean;
	loading?: boolean;
	loadingLabel?: string;
}) {
	return (
		<button
			type="button"
			className={`button ${secondary ? 'secondary' : ''} ${danger ? 'danger' : ''} ${className}`}
			{...props}
			disabled={props.disabled || loading}
			aria-busy={loading || undefined}
		>
			{loading && <CircleNotch className="button-spinner" size={20} aria-hidden />}
			{loading && loadingLabel ? loadingLabel : children}
		</button>
	);
}

export function LinkButton({
	href,
	children,
	secondary = false,
	...props
}: {
	href: string;
	children: ReactNode;
	secondary?: boolean;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
	return (
		<Link passHref href={href} {...props} className={`button ${secondary ? 'secondary' : ''}`}>
			{children}
		</Link>
	);
}
