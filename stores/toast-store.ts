'use client';

import { create } from 'zustand';

export type ToastVariant = 'info' | 'error' | 'success';

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastState = {
  toasts: Toast[];
  pushToast: (toast: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const createToastId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  pushToast: (toast) => {
    const id = createToastId();
    set((state) => ({ toasts: [...state.toasts, { id, ...toast }] }));

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        useToastStore.getState().dismissToast(id);
      }, 5000);
    }

    return id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}));

export const pushToast = (
  message: string,
  variant: ToastVariant = 'info'
): string => useToastStore.getState().pushToast({ message, variant });
