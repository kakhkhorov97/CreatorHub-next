import Script from 'next/script';
import { SiKakaotalk } from 'react-icons/si';
import { FaTelegramPlane } from 'react-icons/fa';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useAction } from '../../hooks/useApi';
import { safeReturnTo } from '../../auth';
import { SocialSignInResult } from '../../types/creatorhub';
import { Button } from '../common/UI';
import SocialSignup, { finishSocialSession } from './SocialSignup';

type TelegramLogin = {
	auth(
		options: { client_id: number; nonce: string; scope: string[]; lang: string },
		callback: (result: { id_token?: string; error?: string }) => void,
	): void;
};
const clientId = Number(process.env.NEXT_PUBLIC_TELEGRAM_CLIENT_ID);

export default function ProviderSignIn({ onSetupChange }: { onSetupChange(setup: boolean): void }) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const action = useAction();
	const [ready, setReady] = useState(false);
	const [nonce, setNonce] = useState('');
	const [scriptError, setScriptError] = useState(false);
	const [pending, setPending] = useState<SocialSignInResult | null>(null);
	const callbackLock = useRef(false);
	const configured = Number.isSafeInteger(clientId) && clientId > 0;

	async function prepare() {
		setNonce('');
		const value = await action.run(() => action.mutate('beginSocialLogin', { provider: 'TELEGRAM' }));
		if (value) setNonce(value);
	}
	useEffect(() => {
		if (configured) void prepare();
		// One nonce per mounted authorization attempt.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	function telegram() {
		const sdk = (window as Window & { Telegram?: { Login: TelegramLogin } }).Telegram?.Login;
		if (!sdk || !nonce || action.busy || callbackLock.current) return;
		const currentNonce = nonce;
		sdk.auth(
			{ client_id: clientId, nonce: currentNonce, scope: ['profile'], lang: router.locale || 'en' },
			(result) => {
				if (callbackLock.current) return;
				callbackLock.current = true;
				void action
					.run(async () => {
						if (!result?.id_token) throw new Error('Telegram sign-in was not completed. Please try again.');
						const response = await action.mutate('loginTelegram', {
							input: { idToken: result.id_token, nonce: currentNonce },
						});
						if (response.session) await finishSocialSession(action, router, response.session);
						else if (response.signupToken) {
							setPending(response);
							onSetupChange(true);
						} else throw new Error('Telegram sign-in was not completed. Please try again.');
						return true;
					})
					.then((success) => {
						callbackLock.current = false;
						if (!success) setNonce('');
					});
			},
		);
	}

	async function kakao() {
		await action.run(async () => {
			const challenge = await action.mutate('beginKakaoLogin');
			const returnTo = typeof router.query.returnTo === 'string' ? safeReturnTo(router.query.returnTo) : undefined;
			sessionStorage.setItem(
				'creatorhub.kakaoAttempt',
				JSON.stringify({ state: challenge.state, returnTo, locale: router.locale, createdAt: Date.now() }),
			);
			window.location.assign(challenge.authorizationUrl);
		});
	}

	return (
		<div className="provider-sign-in">
			{configured && (
				<Script
					src="https://oauth.telegram.org/js/telegram-login.js"
					strategy="afterInteractive"
					onReady={() => setReady(true)}
					onError={() => setScriptError(true)}
				/>
			)}
			{pending ? (
				<SocialSignup
					pending={pending}
					provider="TELEGRAM"
					onBack={() => {
						setPending(null);
						onSetupChange(false);
						void prepare();
					}}
				/>
			) : (
				<>
					<Button secondary className="social-provider-button" disabled={action.busy} onClick={() => void kakao()}>
						<SiKakaotalk
							className="social-provider-icon social-provider-icon--kakao"
							aria-hidden="true"
							focusable="false"
						/>
						{t('Continue with')} Kakao
					</Button>
					<Button
						secondary
						className="social-provider-button"
						disabled={action.busy || !ready || !nonce || scriptError || !configured}
						onClick={telegram}
					>
						<FaTelegramPlane
							className="social-provider-icon social-provider-icon--telegram"
							aria-hidden="true"
							focusable="false"
						/>
						{t('Continue with')} Telegram
					</Button>
					{configured && !ready && !scriptError && <small role="status">{t('Loading Telegram sign-in…')}</small>}
					{configured && ready && !nonce && !action.busy && (
						<Button secondary onClick={() => void prepare()}>
							{t('Try again')}
						</Button>
					)}
				</>
			)}
			{scriptError && (
				<p className="field-error" role="alert">
					{t('Telegram sign-in could not load. Refresh the page and try again.')}
				</p>
			)}
			{!configured && <small>{t('Telegram sign-in is not configured yet.')}</small>}
			{action.error && (
				<p className="field-error" role="alert">
					{t(action.error)}
				</p>
			)}
		</div>
	);
}
