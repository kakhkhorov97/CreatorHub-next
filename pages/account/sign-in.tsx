import AuthForm from '../../libs/components/account/Auth';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';

function AccountPage() {
	return <AuthForm mode="sign-in" />;
}

export default withLayoutBasic(AccountPage, 'Sign in');
