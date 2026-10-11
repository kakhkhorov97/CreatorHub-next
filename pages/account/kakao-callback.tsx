import KakaoCallback from '../../libs/components/account/KakaoCallback';
import { withLayoutBasic } from '../../libs/components/layout/LayoutBasic';

function KakaoCallbackPage() {
	return <KakaoCallback />;
}

export default withLayoutBasic(KakaoCallbackPage, 'Signing in with Kakao');
