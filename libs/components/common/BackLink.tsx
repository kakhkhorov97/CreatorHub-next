import Link from 'next/link';
import { useRouter } from 'next/router';
import { ArrowLeft } from 'phosphor-react';
import { hasInSiteHistory } from '../../hooks/useScrollRestoration';

// Returns to the previous page (with its scroll position, search and filters) when the visitor
// came from inside the site; otherwise it opens the fallback list page.
export function BackLink({ href, label }: { href: string; label: string }) {
	const router = useRouter();
	return (
		<Link
			passHref
			href={href}
			className="back-link"
			aria-label={label}
			title={label}
			onClick={(event) => {
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !hasInSiteHistory()) return;
				event.preventDefault();
				router.back();
			}}
		>
			<ArrowLeft size={22} aria-hidden />
		</Link>
	);
}
