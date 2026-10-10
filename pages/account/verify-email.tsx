import EmailConfirmation from '../../libs/components/account/EmailConfirmation';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';

function AccountPage() {
	return <EmailConfirmation verifyLink />;
}

export default withLayoutBasic(AccountPage, 'Verify email');
