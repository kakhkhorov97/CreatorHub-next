import CompanyContent from '../libs/components/common/CompanyPage';
import { withLayoutBasic } from '../libs/components/layout/LayoutBasic';

function About() {
	return <CompanyContent contact={false} />;
}

export default withLayoutBasic(About, 'About us');
