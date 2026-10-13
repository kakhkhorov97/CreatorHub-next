import { makeVar } from '@apollo/client';
import { User } from '../libs/types/creatorhub';
export const userVar = makeVar<User | null>(null);
export const sessionReadyVar = makeVar(false);

// Display-only identity kept next to a saved session so the header does not flash
// Sign in / Sign up while `me` is still in flight. Never used for role-gated UI:
// localStorage is user-editable, so `role` is trusted only once `me` confirms it.
export type SessionHint = { displayName: string; avatarUrl?: string | null; role: string };
export const sessionHintVar = makeVar<SessionHint | null>(null);
