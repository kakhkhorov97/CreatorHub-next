import { useReactiveVar } from '@apollo/client';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { userVar } from '../../apollo/store';
import { QueryState } from '../../libs/components/common/UI';
import { Conversation } from '../../libs/components/inquiry/InquiryConversation';
import { Draft } from '../../libs/components/inquiry/InquiryDraft';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { useApi } from '../../libs/hooks/useApi';

function InquiryPage() {
	return (
		<Layout title="Inbox">
			<Guard>
				<InquiryContent />
			</Guard>
		</Layout>
	);
}

function InquiryContent() {
	const router = useRouter();
	const id = typeof router.query.id === 'string' ? router.query.id : '';
	const result = useApi('getInquiry', { inquiryId: id }, !id);
	const user = useReactiveVar(userVar)!;
	return (
		<>
			<Link passHref className="back-link" href="/inquiries">
				Back to inquiries
			</Link>
			<QueryState loading={result.loading} error={result.error} retry={() => result.refetch()} />
			{!id && router.isReady ? (
				<Draft
					creatorId={typeof router.query.creatorId === 'string' ? router.query.creatorId : ''}
					serviceId={typeof router.query.serviceId === 'string' ? router.query.serviceId : undefined}
				/>
			) : (
				result.value &&
				(result.value.status === 'DRAFT' ? (
					<Draft
						key={result.value._id}
						inquiry={result.value}
						creatorId={result.value.creatorId}
						serviceId={result.value.serviceId || undefined}
						refresh={() => result.refetch()}
					/>
				) : (
					<Conversation
						key={result.value._id}
						inquiry={result.value}
						isClient={result.value.clientId === user._id}
						refresh={() => result.refetch()}
					/>
				))
			)}
		</>
	);
}

export default InquiryPage;
