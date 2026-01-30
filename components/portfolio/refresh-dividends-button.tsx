'use client';

import { useState } from 'react';

import { pushToast } from '../../stores/toast-store';
import { Button } from '../ui/button';

export function RefreshDividendsButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dividends/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data || data.ok === false) {
        const message =
          (data && data.error && data.error.message) ||
          '配当データの更新に失敗しました。';
        setError(message);
        pushToast(message, 'error');
        return;
      }

      pushToast('配当データを更新しました。', 'success');
    } catch (error) {
      const message = '配当データの更新に失敗しました。';
      setError(message);
      pushToast(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={handleClick} disabled={isLoading}>
        {isLoading ? '更新中...' : '配当データを更新'}
      </Button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
