import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html>
			<Head>
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
				{/* Self-hosted Korean font (dynamic subsets); not on Google Fonts. */}
				<link rel="stylesheet" href="/fonts/pretendard/pretendard.css" />
			</Head>
			<body>
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
