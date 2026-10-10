import EmailConfirmation from '../../libs/components/account/EmailConfirmation';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';

function CheckEmailPage() {
	return <EmailConfirmation />;
}

export default withLayoutBasic(CheckEmailPage, 'Check your email');
