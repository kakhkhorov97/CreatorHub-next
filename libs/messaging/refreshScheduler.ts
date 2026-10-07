// Coalesce invalidations without delaying incoming message bodies.
export function createRefreshScheduler(refresh: () => Promise<unknown> | unknown, delay = 300) {
	let timer: ReturnType<typeof setTimeout> | undefined;
	let running = false;
	let pending = false;
	let disposed = false;
	const schedule = () => {
		if (disposed) return;
		pending = true;
		if (timer || running) return;
		timer = setTimeout(async () => {
			timer = undefined;
			pending = false;
			running = true;
			try {
				await refresh();
			} catch {
				/* Each query owns its visible error state. */
			} finally {
				running = false;
				if (pending) schedule();
			}
		}, delay);
	};
	return {
		schedule,
		dispose: () => {
			disposed = true;
			pending = false;
			clearTimeout(timer);
		},
	};
}
