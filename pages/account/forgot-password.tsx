import AuthForm from '../../libs/components/account/Auth';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';

function AccountPage() {
	return <AuthForm mode="forgot-password" />;
}

export default withLayoutBasic(AccountPage, 'Reset password');
