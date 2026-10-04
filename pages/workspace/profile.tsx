import { Heading, QueryState } from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { ProfileForm } from '../../libs/components/workspace/ProfileForm';
import { useApi } from '../../libs/hooks/useApi';

function ProfileEditor() {
	return (
		<Layout title="Creator profile" area="workspace">
			<Guard>
				<ProfileContent />
			</Guard>
		</Layout>
	);
}

function ProfileContent() {
	const profile = useApi('myCreatorProfile');
	const notFound = profile.error?.graphQLErrors.some(
		(e) => e.extensions?.code === 'NOT_FOUND' || e.message === 'Not found' || e.message === 'Record not found',
	);
	return (
		<>
			<Heading title="Creator profile" />
			<QueryState loading={profile.loading} error={notFound ? undefined : profile.error} />
			{!profile.loading && (!profile.error || notFound) && (
				<ProfileForm key={profile.value?._id || 'new'} profile={profile.value} refresh={() => profile.refetch()} />
			)}
		</>
	);
}

export default ProfileEditor;
