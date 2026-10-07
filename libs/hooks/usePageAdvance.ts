import { useEffect, useRef, useState } from 'react';

/** Check the next page while preserving the current page and its scroll position. */
export function usePageAdvance(contextKey: string, hasNextRows: () => Promise<boolean>, advance: () => void) {
	const [checkingNext, setCheckingNext] = useState(false);
	const [noMoreResults, setNoMoreResults] = useState(false);
	const [nextPageError, setNextPageError] = useState(false);
	const lock = useRef(false);
	const currentContext = useRef<string | null>(contextKey);
	currentContext.current = contextKey;
	useEffect(() => {
		setNoMoreResults(false);
		setNextPageError(false);
		currentContext.current = contextKey;
		return () => { currentContext.current = null; };
	}, [contextKey]);

	async function next() {
		if (lock.current) return false;
		lock.current = true;
		setCheckingNext(true);
		setNextPageError(false);
		const requestedContext = contextKey;
		try {
			const populated = await hasNextRows();
			if (currentContext.current !== requestedContext) return false;
			if (!populated) {
				setNoMoreResults(true);
				return false;
			}
			advance();
			return true;
		} catch {
			if (currentContext.current === requestedContext) setNextPageError(true);
			return false;
		} finally {
			lock.current = false;
			if (currentContext.current !== null) setCheckingNext(false);
		}
	}

	return { next, checkingNext, noMoreResults, nextPageError };
}
