'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState, useTransition } from 'react';

import { signUp } from '../../lib/auth/actions';
import type { AuthFieldErrors } from '../../lib/auth/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const MIN_PASSWORD_LENGTH = 6;

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateSignupInput = (
  email: string,
  password: string,
  passwordConfirm: string
): AuthFieldErrors => {
  const errors: AuthFieldErrors = {};

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

  if (!passwordConfirm) {
    errors.passwordConfirm = 'Password confirmation is required';
  } else if (passwordConfirm !== password) {
    errors.passwordConfirm = 'Passwords do not match';
  }

  return errors;
};

export function SignupForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    const passwordConfirm = String(formData.get('passwordConfirm') ?? '');

    const clientErrors = validateSignupInput(email, password, passwordConfirm);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await signUp({ email, password, passwordConfirm });

      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.formError ?? null);
        return;
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email && (
          <p className="text-sm text-red-600">{fieldErrors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.password)}
        />
        {fieldErrors.password && (
          <p className="text-sm text-red-600">{fieldErrors.password}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password-confirm">Confirm Password</Label>
        <Input
          id="signup-password-confirm"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(fieldErrors.passwordConfirm)}
        />
        {fieldErrors.passwordConfirm && (
          <p className="text-sm text-red-600">{fieldErrors.passwordConfirm}</p>
        )}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Signing up...' : 'Create account'}
      </Button>
    </form>
  );
}
