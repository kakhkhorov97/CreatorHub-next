import { useTranslation as useSiteTranslation } from 'next-i18next';
import Link from 'next/link';
import { Component, ErrorInfo, ReactNode } from 'react';

function CrashNotice({ onRetry }: { onRetry(): void }) {
	const { t: translate } = useSiteTranslation('common');

	return (
		<section className="app-crash" role="alert">
			<h1>{translate('Something went wrong')}</h1>
			<p>{translate('This page stopped working. Reload it to try again. Your account and saved work are safe.')}</p>
			<div className="app-crash-actions">
				<button type="button" className="button" onClick={onRetry}>
					{translate('Reload page')}
				</button>
				<Link className="button secondary" href="/">
					{translate('Go to the homepage')}
				</Link>
			</div>
		</section>
	);
}

/** Without this, a render error unmounts the whole app and leaves a blank white page. */
export default class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
	state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error('CreatorHub page error', error, info.componentStack);
	}

	render() {
		return this.state.failed ? <CrashNotice onRetry={() => window.location.reload()} /> : this.props.children;
	}
}
