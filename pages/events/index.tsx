import { useTranslation as useSiteTranslation } from 'next-i18next';
import { Heading } from '../../libs/components/common/UI';
import { EventsSection } from '../../libs/components/events/Events';
import Layout from '../../libs/components/layout/LayoutBasic';

export default function Events() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('Events')}>
			<Heading title={translate('Meet through creativity')} />
			<p className="muted">
				{translate(
					'Find creative events across the community. Fictional event concepts are labeled and are not open for registration.',
				)}
			</p>
			<EventsSection />
		</Layout>
	);
}
