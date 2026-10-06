import { useTranslation as useSiteTranslation } from 'next-i18next';
import Finder from '../libs/components/discovery/Finder';
import Layout from '../libs/components/layout/LayoutBasic';

export default function Page() {
	const { t: translate } = useSiteTranslation('common');

	return (
		<Layout title={translate('AI finder')}>
			<div className="finder-page">
				<Finder />
			</div>
		</Layout>
	);
}
