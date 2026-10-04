import { makeVar } from '@apollo/client';
import { User } from '../libs/types/creatorhub';
export const userVar = makeVar<User | null>(null);
export const sessionReadyVar = makeVar(false);
