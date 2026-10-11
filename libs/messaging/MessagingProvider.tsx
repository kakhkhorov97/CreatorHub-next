import { useReactiveVar } from '@apollo/client';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { userVar } from '../../apollo/store';
import { accessToken, clearSession, endpoint } from '../auth';
import { createRefreshScheduler } from './refreshScheduler';
import { InquiryMessage, SendMessageInput } from '../types/creatorhub';

type Change = { inquiryId: string; kind: 'message' | 'inquiry' | 'read'; version: number; message?: InquiryMessage };
export type MessagingEvent =
	| { type: 'sync' }
	| { type: 'inbox'; change: Change }
	| { type: 'conversation'; change: Change };
type State = 'connecting' | 'connected' | 'reconnecting' | 'offline';
type Ack<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

type Messaging = {
	state: State;
	subscribe: (listener: (event: MessagingEvent) => void) => () => void;
	join: (inquiryId: string) => Promise<unknown>;
	leave: (inquiryId: string) => void;
	send: (input: SendMessageInput) => Promise<InquiryMessage>;
};
const MessagingContext = createContext<Messaging | null>(null);

export function MessagingProvider({ children }: { children: ReactNode }) {
	const user = useReactiveVar(userVar);
	const userId = user?._id;
	const socketRef = useRef<Socket>();
	const ready = useRef(false);
	const listeners = useRef(new Set<(event: MessagingEvent) => void>());
	const roomQueue = useRef<Promise<unknown>>(Promise.resolve());
	const [state, setState] = useState<State>('offline');
	const subscribe = useCallback((listener: (event: MessagingEvent) => void) => {
		listeners.current.add(listener);
		return () => {
			listeners.current.delete(listener);
		};
	}, []);

	useEffect(() => {
		if (!userId) {
			setState('offline');
			return;
		}
		let active = true;
		let expiryReconnect: ReturnType<typeof setTimeout> | undefined;
		const socket = io(`${new URL(endpoint).origin}/messaging`, {
			transports: ['websocket'],
			autoConnect: false,
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			auth: (done) => {
				accessToken()
					.then((token) => {
						if (active) done({ token });
					})
					.catch(() => {
						if (active) {
							setState('reconnecting');
							socket.disconnect();
							clearTimeout(expiryReconnect);
							expiryReconnect = setTimeout(() => {
								if (active) socket.connect();
							}, 5000);
						}
					});
			},
		});
		socketRef.current = socket;
		ready.current = false;
		setState('connecting');
		const dispatch = (event: MessagingEvent) => {
			if (active) listeners.current.forEach((listener) => listener(event));
		};
		socket.on('messaging:ready', () => {
			ready.current = true;
			setState('connected');
			dispatch({ type: 'sync' });
		});
		socket.on('inbox:changed', (change: Change) => dispatch({ type: 'inbox', change }));
		socket.on('inquiry:changed', (change: Change) => dispatch({ type: 'conversation', change }));
		socket.on('disconnect', () => {
			ready.current = false;
			if (active) setState('reconnecting');
		});
		socket.on('connect_error', (error: Error & { data?: { code?: string } }) => {
			if (!active) return;
			if (error.data?.code === 'UNAUTHENTICATED') clearSession();
			else setState('reconnecting');
		});
		socket.on('session:invalid', () => clearSession());
		socket.on('session:expired', () => {
			expiryReconnect = setTimeout(() => {
				if (active) socket.connect();
			}, 250);
		});
		const resume = () => {
			if (document.visibilityState !== 'visible') return;
			if (socket.connected && ready.current) dispatch({ type: 'sync' });
			else socket.connect();
		};
		document.addEventListener('visibilitychange', resume);
		window.addEventListener('online', resume);
		socket.connect();
		return () => {
			active = false;
			ready.current = false;
			clearTimeout(expiryReconnect);
			document.removeEventListener('visibilitychange', resume);
			window.removeEventListener('online', resume);
			socket.removeAllListeners();
			socket.disconnect();
			if (socketRef.current === socket) socketRef.current = undefined;
			roomQueue.current = Promise.resolve();
		};
	}, [userId]);

	const request = useCallback(<T,>(event: string, input: unknown): Promise<T> => {
		const socket = socketRef.current;
		if (!socket?.connected || !ready.current)
			return Promise.reject(new Error('Messages are reconnecting. Your draft is kept. Try again when connected.'));
		return new Promise((resolve, reject) => {
			socket.timeout(10000).emit(event, input, (error: Error | null, reply: Ack<T>) => {
				if (socketRef.current !== socket) return reject(new Error('Your session changed. Please sign in again.'));
				if (error || !reply)
					return reject(new Error('Delivery could not be confirmed. Your draft is kept. Try again.'));
				if (!reply.ok) return reject(new Error(reply.error.message));
				resolve(reply.data);
			});
		});
	}, []);
	const join = useCallback(
		(inquiryId: string) => {
			const socket = socketRef.current;
			const next = roomQueue.current
				.catch(() => {})
				.then(() => {
					if (socket !== socketRef.current) throw new Error('Your session changed. Please sign in again.');
					return request('inquiry:join', { inquiryId });
				});
			roomQueue.current = next;
			return next;
		},
		[request],
	);
	const leave = useCallback(
		(inquiryId: string) => {
			const socket = socketRef.current;
			roomQueue.current = roomQueue.current
				.catch(() => {})
				.then(() => {
					if (socket === socketRef.current && socket?.connected && ready.current)
						return request('inquiry:leave', { inquiryId });
				})
				.catch(() => {});
		},
		[request],
	);
	const send = useCallback((input: SendMessageInput) => request<InquiryMessage>('message:send', input), [request]);
	return (
		<MessagingContext.Provider value={{ state, subscribe, join, leave, send }}>{children}</MessagingContext.Provider>
	);
}

export function useMessaging() {
	const value = useContext(MessagingContext);
	if (!value) throw new Error('MessagingProvider is required.');
	return value;
}

export function useMessagingEvents(listener: (event: MessagingEvent) => void) {
	const { subscribe } = useMessaging();
	const callback = useRef(listener);
	callback.current = listener;
	useEffect(() => subscribe((event) => callback.current(event)), [subscribe]);
}

export function useMessagingRefresh(
	matches: (event: MessagingEvent) => boolean,
	refresh: () => Promise<unknown> | unknown,
) {
	const callback = useRef(refresh);
	callback.current = refresh;
	const scheduler = useRef<ReturnType<typeof createRefreshScheduler>>();
	useEffect(() => {
		const queue = createRefreshScheduler(() => callback.current());
		scheduler.current = queue;
		return () => queue.dispose();
	}, []);
	useMessagingEvents((event) => {
		if (matches(event)) scheduler.current?.schedule();
	});
}
