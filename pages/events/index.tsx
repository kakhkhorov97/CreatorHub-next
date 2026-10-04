import { Heading } from '../../libs/components/common/UI';
import { EventsSection } from '../../libs/components/events/Events';
import Layout from '../../libs/components/layout/LayoutBasic';

export default function Events() {
	return (
		<Layout title="Events">
			<Heading title="Meet through creativity" />
			<p className="muted">
				Find creative events across the community. Demo events are clearly labeled and are not open for registration.
			</p>
			<EventsSection />
		</Layout>
	);
}
