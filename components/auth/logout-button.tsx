'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { signOut } from '../../lib/auth/actions';
import { Button } from '../ui/button';

export function LogoutButton() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    setError(null);

    startTransition(async () => {
      const result = await signOut();

      if (!result.ok) {
        setError(result.formError ?? 'Failed to log out');
        return;
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
    });
  };

  return (
    <div className="space-y-2">
      <Button type="button" onClick={handleLogout} disabled={isPending}>
        {isPending ? 'Logging out...' : 'Log out'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
