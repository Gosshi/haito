'use client';

import { useRouter } from 'next/navigation';
import type { FormEvent } from 'react';
import { useState, useTransition } from 'react';

import { signIn } from '../../lib/auth/actions';
import type { AuthFieldErrors } from '../../lib/auth/types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const MIN_PASSWORD_LENGTH = 6;

const isValidEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validateLoginInput = (email: string, password: string): AuthFieldErrors => {
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

  return errors;
};

export function LoginForm() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');

    const clientErrors = validateLoginInput(email, password);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setFormError(null);
      return;
    }

    setFieldErrors({});
    setFormError(null);

    startTransition(async () => {
      const result = await signIn({ email, password });

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
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
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
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={Boolean(fieldErrors.password)}
        />
        {fieldErrors.password && (
          <p className="text-sm text-red-600">{fieldErrors.password}</p>
        )}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );
}
