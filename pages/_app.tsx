import PostHogPageViews from '../libs/analytics/PostHogPageViews';
import { MessagingProvider } from '../libs/messaging/MessagingProvider';
import { ApolloProvider } from '@apollo/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import i18nConfig from '../next-i18next.config';
import { Bricolage_Grotesque, Hanken_Grotesk } from 'next/font/google';
import { Toaster } from 'sonner';
import { useApollo } from '../apollo/client';
import Chatbot from '../libs/components/chat/Chatbot';
import { SessionBootstrap } from '../libs/components/layout/LayoutBasic';
import RouteProgress from '../libs/components/layout/RouteProgress';
import AppErrorBoundary from '../libs/components/common/AppErrorBoundary';
import '../scss/main.scss';
import { theme } from '../scss/MaterialTheme';

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], weight: ['700', '800'], display: 'swap' });
const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap' });

function App({ Component, pageProps, router }: AppProps) {
	const client = useApollo();
	return (
		<ApolloProvider client={client}>
			{/* Expose the font families on :root so portals (MUI dialogs, toasts) inherit them too. */}
			<style jsx global>{`
				:root {
					--font-bricolage: ${bricolage.style.fontFamily};
					--font-hanken: ${hanken.style.fontFamily};
				}
			`}</style>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<MessagingProvider>
					<RouteProgress />
					<SessionBootstrap />
					<PostHogPageViews />
					<AppErrorBoundary key={router.pathname}>
						<Component {...pageProps} />
					</AppErrorBoundary>
					<Toaster richColors closeButton position="top-right" />
					<Chatbot />
				</MessagingProvider>
			</ThemeProvider>
		</ApolloProvider>
	);
}

export default appWithTranslation(App, { ...i18nConfig, keySeparator: false, nsSeparator: false });
