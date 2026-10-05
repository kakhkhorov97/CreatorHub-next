import Link from 'next/link';
import { useRouter } from 'next/router';
import { Draft } from '../../libs/components/inquiry/InquiryDraft';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { Inbox } from './index';

export default function InquiryPage() {
	const router = useRouter();
	return (
		<Layout title="Inbox">
			<Guard>
				{router.pathname === '/inquiries/new' ? (
					<>
						<Link passHref className="back-link" href="/inquiries?inbox=sent">
							Back to inbox
						</Link>
						<Draft
							creatorId={typeof router.query.creatorId === 'string' ? router.query.creatorId : ''}
							serviceId={typeof router.query.serviceId === 'string' ? router.query.serviceId : undefined}
						/>
					</>
				) : (
					<Inbox selectedId={typeof router.query.id === 'string' ? router.query.id : ''} />
				)}
			</Guard>
		</Layout>
	);
}
