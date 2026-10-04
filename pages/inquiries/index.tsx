import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { userVar } from '../../apollo/store';
import { date, Empty, Heading, Pager, QueryState, Status } from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { usePaged } from '../../libs/hooks/usePaged';

function InquiryInbox() {
	return (
		<Layout title="Inbox">
			<Guard>
				<Inbox />
			</Guard>
		</Layout>
	);
}

function Inbox() {
	const router = useRouter();
	const creatorInbox = router.query.inbox === 'creator';
	const setCreatorInbox = (value: boolean) =>
		router.replace(value ? '/inquiries?inbox=creator' : '/inquiries', undefined, { shallow: true });
	const result = usePaged('getInquiries', { creatorInbox });
	const user = useReactiveVar(userVar);
	return (
		<>
			<Heading title="Inbox" />
			<p className="muted">Have private conversations with creators about your projects.</p>
			<nav className="tabs">
				<button className={!creatorInbox ? 'active' : ''} onClick={() => setCreatorInbox(false)}>
					Sent inquiries
				</button>
				{user?.role !== 'USER' && (
					<button className={creatorInbox ? 'active' : ''} onClick={() => setCreatorInbox(true)}>
						Creator inbox
					</button>
				)}
			</nav>
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			<div className="inquiry-list">
				{result.rows.map((i) => (
					<Link passHref className="list-row" key={i._id} href={`/inquiries/${i._id}`}>
						<div>
							<h3>{i.subject || 'Untitled draft'}</h3>
							<p className="muted">{i.brief?.slice(0, 150) || 'Continue writing your inquiry.'}</p>
						</div>
						<Status value={i.status} />
						<time>{date(i.updatedAt)}</time>
					</Link>
				))}
			</div>
			{!result.loading && !result.error && !result.rows.length && (
				<Empty title="No inquiries yet">Explore creators and send an inquiry when you find a good fit.</Empty>
			)}
			<Pager {...result} />
		</>
	);
}

export default InquiryInbox;
