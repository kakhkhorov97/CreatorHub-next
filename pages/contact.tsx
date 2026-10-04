import CompanyContent from '../libs/components/common/CompanyPage';
import { withLayoutBasic } from '../libs/components/layout/LayoutBasic';

function Contact() {
	return <CompanyContent contact={true} />;
}

export default withLayoutBasic(Contact, 'Contact us');
