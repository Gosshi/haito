'use server';

import type { AuthAction, AuthResult } from './types';

const notImplemented = (): AuthResult => ({
  ok: false,
  formError: 'Not implemented',
});

export const signUp: AuthAction = async () => notImplemented();

export const signIn: AuthAction = async () => notImplemented();

export const signOut = async (): Promise<AuthResult> => notImplemented();
