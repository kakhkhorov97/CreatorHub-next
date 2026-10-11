import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useAction } from '../../hooks/useApi';
import { safeReturnTo } from '../../auth';
import { SocialSignInResult } from '../../types/creatorhub';
import { Button } from '../common/UI';
import SocialSignup, { finishSocialSession } from './SocialSignup';

export default function KakaoCallback() {
	const router = useRouter();
	const { t } = useTranslation('common');
	const action = useAction();
	const started = useRef(false);
	const [pending, setPending] = useState<SocialSignInResult | null>(null);
	const [destination, setDestination] = useState<string | undefined>();
	const [finished, setFinished] = useState(false);
	useEffect(() => {
		if (!router.isReady || started.current) return;
		started.current = true;
		const { code, state, error } = router.query;
		void action
			.run(async () => {
				const stored = sessionStorage.getItem('creatorhub.kakaoAttempt');
				sessionStorage.removeItem('creatorhub.kakaoAttempt');
				// Remove the one-use authorization code even when the saved browser state is invalid.
				await router.replace('/account/kakao-callback', undefined, { shallow: true });
				let attempt: { state?: string; returnTo?: string; createdAt?: number };
				try {
					attempt = JSON.parse(stored || '{}');
				} catch {
					throw new Error('Kakao sign-in expired. Please try again.');
				}

				if (
					typeof state !== 'string' ||
					state !== attempt?.state ||
					!attempt.createdAt ||
					Date.now() - attempt.createdAt > 10 * 60000
				)
					throw new Error('Kakao sign-in expired. Please try again.');
				if (error || typeof code !== 'string') throw new Error('Kakao sign-in was not completed. Please try again.');
				const returnTo = attempt.returnTo ? safeReturnTo(attempt.returnTo) : undefined;
				setDestination(returnTo);
				const result = await action.mutate('loginKakao', { input: { code, state } });
				if (result.session) await finishSocialSession(action, router, result.session, returnTo);
				else if (result.signupToken) setPending(result);
				else throw new Error('Kakao sign-in could not be verified. Please try again.');
			})
			.then(() => setFinished(true));
		// The callback is processed once, including under React strict effects.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [router.isReady]);
	return (
		<div className="auth-page">
			<div className="auth-layout">
				<section className="auth-panel panel">
					<h1>{t(pending ? 'Complete your account' : 'Signing in with Kakao')}</h1>
					{pending ? (
						<>
							<p className="muted">{t('Add your contact details to finish creating your account.')}</p>
							<SocialSignup
								pending={pending}
								provider="KAKAO"
								destination={destination}
								onBack={() => void router.push('/account/sign-in')}
							/>
						</>
					) : (
						<>
							{!finished && !action.error && <p role="status">{t('Please wait…')}</p>}
							{action.error && (
								<p className="field-error" role="alert">
									{t(action.error)}
								</p>
							)}
							{finished && (
								<Button onClick={() => void router.push('/account/sign-in')} secondary>
									{t('Back to sign in')}
								</Button>
							)}
						</>
					)}
				</section>
			</div>
		</div>
	);
}
