import AuthForm from '../../libs/components/account/Auth';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';

function AccountPage() {
	return <AuthForm mode="reset-password" />;
}

export default withLayoutBasic(AccountPage, 'Set a new password');
