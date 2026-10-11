import { useEffect } from 'react';
import { useRouter } from 'next/router';
import type { PostHog } from 'posthog-js';
import { publicPageUrl, sanitizePageView } from './pageViews';

const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
let clientPending: Promise<PostHog> | null = null;
let lastPage: string | null = null;

function loadClient() {
	if (!clientPending) {
		clientPending = import('posthog-js')
			.then(({ default: posthog }) => {
				posthog.init(token!, {
					api_host: host,
					autocapture: false,
					capture_pageview: false,
					capture_pageleave: false,
					capture_dead_clicks: false,
					capture_exceptions: false,
					disable_session_recording: true,
					disable_surveys: true,
					enable_heatmaps: false,
					advanced_disable_flags: true,
					disable_external_dependency_loading: true,
					person_profiles: 'never',
					persistence: 'sessionStorage',
					before_send: sanitizePageView,
				});
				return posthog;
			})
			.catch((error) => {
				clientPending = null;
				throw error;
			});
	}
	return clientPending;
}

export default function PostHogPageViews() {
	const router = useRouter();
	useEffect(() => {
		if (!router.isReady || !token || !host) return;
		const page = publicPageUrl(router.pathname, router.asPath, window.location.origin);
		if (!page) {
			lastPage = null;
			return;
		}
		let cancelled = false;
		void loadClient()
			.then((posthog) => {
				if (cancelled || lastPage === page) return;
				const url = new URL(page);
				posthog.capture('$pageview', { $current_url: page, $pathname: url.pathname, $host: url.host });
				lastPage = page;
			})
			.catch(() => {
				// Analytics must never interrupt navigation or authentication.
			});
		return () => {
			cancelled = true;
		};
	}, [router.isReady, router.pathname, router.asPath]);
	return null;
}
