import { ApolloProvider } from '@apollo/client';
import { CssBaseline, ThemeProvider } from '@mui/material';
import type { AppProps } from 'next/app';
import { Toaster } from 'sonner';
import { useApollo } from '../apollo/client';
import Chatbot from '../libs/components/chat/Chatbot';
import { SessionBootstrap } from '../libs/components/layout/LayoutBasic';
import '../scss/main.scss';
import { theme } from '../scss/MaterialTheme';

export default function App({ Component, pageProps }: AppProps) {
	const client = useApollo();
	return (
		<ApolloProvider client={client}>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<SessionBootstrap />
				<Component {...pageProps} />
				<Toaster richColors closeButton position="top-right" />
				<Chatbot />
			</ThemeProvider>
		</ApolloProvider>
	);
}
