import AuthForm from '../../libs/components/account/Auth';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';

function AccountPage() {
	return <AuthForm mode="verify-email" />;
}

export default withLayoutBasic(AccountPage, 'Verify email');
