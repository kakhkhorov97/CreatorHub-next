import { MessagingProvider } from '../libs/messaging/MessagingProvider';
import { ApolloProvider } from '@apollo/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import type { AppProps } from 'next/app';
import { appWithTranslation } from 'next-i18next';
import i18nConfig from '../next-i18next.config';
import { Toaster } from 'sonner';
import { useApollo } from '../apollo/client';
import Chatbot from '../libs/components/chat/Chatbot';
import { SessionBootstrap } from '../libs/components/layout/LayoutBasic';
import '../scss/main.scss';
import { theme } from '../scss/MaterialTheme';

function App({ Component, pageProps }: AppProps) {
	const client = useApollo();
	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<MessagingProvider>
					<SessionBootstrap />
					<Component {...pageProps} />
					<Toaster richColors closeButton position="top-right" />
					<Chatbot />
				</MessagingProvider>
			</ThemeProvider>
		</ApolloProvider>
	);
}

export default appWithTranslation(App, { ...i18nConfig, keySeparator: false, nsSeparator: false });
