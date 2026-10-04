import AuthForm from '../../libs/components/account/Auth';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';

function AccountPage() {
	return <AuthForm mode="register" />;
}

export default withLayoutBasic(AccountPage, 'Create an account');
