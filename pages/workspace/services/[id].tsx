const kind: 'project' | 'service' = 'service';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Heading, Notice, QueryState } from '../../../libs/components/common/UI';
import Layout, { Guard } from '../../../libs/components/layout/LayoutBasic';
import { EditorForm } from '../../../libs/components/workspace/ContentForm';
import { useApi } from '../../../libs/hooks/useApi';
import { useOwnedItem } from '../../../libs/hooks/useOwnedItem';

function ContentEditor() {
	return (
		<Layout title={`Edit ${kind}`} area="workspace">
			<Guard creatorOnly>
				<Content />
			</Guard>
		</Layout>
	);
}

function Content() {
	const router = useRouter();
	const id = typeof router.query.id === 'string' ? router.query.id : '';
	const item = useOwnedItem(kind, id);
	const profile = useApi('myCreatorProfile');
	return (
		<>
			<Heading title={`${id ? 'Edit' : 'New'} ${kind}`} />
			<QueryState loading={item.loading || profile.loading} error={item.error} />
			{profile.error && !profile.value ? (
				<Notice>
					Create your{' '}
					<Link passHref href="/workspace/profile">
						creator profile
					</Link>{' '}
					before adding {kind}s.
				</Notice>
			) : (
				!item.loading &&
				!item.error &&
				profile.value && (
					<EditorForm
						key={item.value?._id || 'new'}
						kind={kind}
						item={item.value}
						profilePublished={profile.value.status === 'PUBLISHED'}
					/>
				)
			)}
		</>
	);
}
export default ContentEditor;
