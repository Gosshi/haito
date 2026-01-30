'use server';

import { createClient } from '../supabase/server';

import type { AuthAction, AuthFieldErrors, AuthInput, AuthResult } from './types';

const MIN_PASSWORD_LENGTH = 6;

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const buildFieldErrors = (
  input: AuthInput,
  options: { confirmPassword?: boolean } = {}
): AuthFieldErrors => {
  const errors: AuthFieldErrors = {};
  const email = input.email.trim();
  const password = input.password;
  const passwordConfirm = input.passwordConfirm ?? '';

  if (!email) {
    errors.email = 'Email is required';
  } else if (!isValidEmail(email)) {
    errors.email = 'Email format is invalid';
  }

  if (!password) {
    errors.password = 'Password is required';
  } else if (password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (options.confirmPassword) {
    if (!passwordConfirm) {
      errors.passwordConfirm = 'Password confirmation is required';
    } else if (passwordConfirm !== password) {
      errors.passwordConfirm = 'Passwords do not match';
    }
  }

  return errors;
};

const hasFieldErrors = (errors: AuthFieldErrors): boolean =>
  Object.keys(errors).length > 0;

export const signUp: AuthAction = async (input) => {
  const fieldErrors = buildFieldErrors(input, { confirmPassword: true });

  if (hasFieldErrors(fieldErrors)) {
    return { ok: false, fieldErrors };
  }

  const supabase = createClient();
  const email = input.email.trim();
  const password = input.password;

  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { ok: false, formError: error.message };
  }

  return { ok: true, redirectTo: '/dashboard' };
};

export const signIn: AuthAction = async (input) => {
  const fieldErrors = buildFieldErrors(input);

  if (hasFieldErrors(fieldErrors)) {
    return { ok: false, fieldErrors };
  }

  const supabase = createClient();
  const email = input.email.trim();
  const password = input.password;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { ok: false, formError: error.message };
  }

  return { ok: true, redirectTo: '/dashboard' };
};

export const signOut = async (): Promise<AuthResult> => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false, formError: error.message };
  }

  return { ok: true, redirectTo: '/login' };
};
