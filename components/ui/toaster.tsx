'use client';

import { Button } from './button';
import { useToastStore } from '../../stores/toast-store';

const variantStyles = {
  info: 'bg-slate-900 text-white',
  error: 'bg-red-600 text-white',
  success: 'bg-emerald-600 text-white',
} as const;

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed right-6 top-6 z-50 flex w-full max-w-sm flex-col gap-3"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={[
            'flex items-start justify-between gap-4 rounded-lg px-4 py-3 shadow-lg',
            variantStyles[toast.variant],
          ].join(' ')}
        >
          <p className="text-sm">{toast.message}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => dismissToast(toast.id)}
            className="text-white hover:bg-white/10"
          >
            閉じる
          </Button>
        </div>
      ))}
    </div>
  );
}
