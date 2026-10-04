import Link from 'next/link';
import React, { ReactNode } from 'react';

export function Button({
	children,
	secondary,
	danger,
	className = '',
	...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean; danger?: boolean }) {
	return (
		<button
			type="button"
			className={`button ${secondary ? 'secondary' : ''} ${danger ? 'danger' : ''} ${className}`}
			{...props}
		>
			{children}
		</button>
	);
}

export function LinkButton({
	href,
	children,
	secondary = false,
}: {
	href: string;
	children: ReactNode;
	secondary?: boolean;
}) {
	return (
		<Link passHref href={href} className={`button ${secondary ? 'secondary' : ''}`}>
			{children}
		</Link>
	);
}
