import { useTranslation as useSiteTranslation } from 'next-i18next';
import { Heading, QueryState } from '../../libs/components/common/UI';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { ProfileForm } from '../../libs/components/workspace/ProfileForm';
import { useApi } from '../../libs/hooks/useApi';

function ProfileEditor() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Creator profile')} area="workspace">
			<Guard>
				<ProfileContent />
			</Guard>
		</Layout>
	);
}

function ProfileContent() {
	const { t: translate } = useSiteTranslation('common');

	const profile = useApi('myCreatorProfile');
	const notFound = profile.error?.graphQLErrors.some(
		(e) => e.extensions?.code === 'NOT_FOUND' || e.message === 'Not found' || e.message === 'Record not found',
	);
	return (
		<>
			<Heading title={translate('Creator profile')} />
			<QueryState loading={profile.loading} error={notFound ? undefined : profile.error} />
			{!profile.loading && (!profile.error || notFound) && (
				<ProfileForm key={profile.value?._id || 'new'} profile={profile.value} refresh={() => profile.refetch()} />
			)}
		</>
	);
}

export default ProfileEditor;
