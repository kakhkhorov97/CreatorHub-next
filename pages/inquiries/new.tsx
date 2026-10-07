import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { ContactCreator } from '../../libs/components/inquiry/ContactCreator';
import Layout, { Guard } from '../../libs/components/layout/LayoutBasic';
import { Empty, LinkButton, Heading } from '../../libs/components/common/UI';
import { useCreatorDirectory } from '../../libs/hooks/useCreatorDirectory';

function NewInquiry() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const creatorId = typeof router.query.creatorId === 'string' ? router.query.creatorId : '';
	const directory = useCreatorDirectory(creatorId ? [creatorId] : []);
	const creator = directory[creatorId];
	return (
		<>
			{creator ? (
				<>
					<Heading title={t('Contact Creator')}>
						<p>{t('Message creator', { name: creator.identity.displayName })}</p>
					</Heading>
					<ContactCreator
						creator={creator}
						serviceId={typeof router.query.serviceId === 'string' ? router.query.serviceId : undefined}
						onDismiss={() => {
							void router.replace(`/creators/${creator.slug}`);
						}}
					/>
				</>
			) : (
				<Empty title={t('Contact Creator')}>
					<p>{t('Choose a creator or service first.')}</p>
					<LinkButton href="/creators">{t('Browse creators')}</LinkButton>
				</Empty>
			)}
		</>
	);
}

export default function NewInquiryPage() {
	const { t } = useTranslation('common');
	return (
		<Layout title={t('Contact Creator')}>
			<Guard>
				<NewInquiry />
			</Guard>
		</Layout>
	);
}
