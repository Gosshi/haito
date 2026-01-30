'use client';

import { create } from 'zustand';

import type {
  DeleteHoldingInput,
  Holding,
  NewHolding,
  UpdateHoldingInput,
} from '../lib/holdings/types';
import {
  createHolding,
  deleteHolding as deleteHoldingApi,
  fetchHoldings as fetchHoldingsApi,
  type HoldingsErrorType,
  updateHolding as updateHoldingApi,
} from '../lib/api/holdings';
import { pushToast } from './toast-store';

export type HoldingsActionResult =
  | { ok: true }
  | { ok: false; error: string; errorType: HoldingsErrorType };

const resolveAuthToastMessage = (
  errorType: HoldingsErrorType,
  message: string
): string | null => {
  if (errorType === 'unauthorized') {
    return '認証が必要です。';
  }

  if (/permission|row-level security|policy/i.test(message)) {
    return '権限がありません。';
  }

  return null;
};

type HoldingsState = {
  holdings: Holding[];
  isLoading: boolean;
  error: string | null;
  fetchHoldings: () => Promise<void>;
  addHolding: (input: NewHolding) => Promise<HoldingsActionResult>;
  updateHolding: (input: UpdateHoldingInput) => Promise<HoldingsActionResult>;
  deleteHolding: (input: DeleteHoldingInput) => Promise<HoldingsActionResult>;
};

export const useHoldingsStore = create<HoldingsState>((set, get) => ({
  holdings: [],
  isLoading: false,
  error: null,
  fetchHoldings: async () => {
    set({ isLoading: true, error: null });

    const result = await fetchHoldingsApi();
    if (!result.ok) {
      set({ isLoading: false, error: result.error.message });
      return;
    }

    set({ holdings: result.data, isLoading: false, error: null });
  },
  addHolding: async (input) => {
    set({ isLoading: true, error: null });

    const createResult = await createHolding(input);
    if (!createResult.ok) {
      set({ isLoading: false, error: createResult.error.message });
      return {
        ok: false,
        error: createResult.error.message,
        errorType: createResult.error.type,
      };
    }

    const refreshResult = await fetchHoldingsApi();
    if (!refreshResult.ok) {
      set({ isLoading: false, error: refreshResult.error.message });
      return {
        ok: false,
        error: refreshResult.error.message,
        errorType: refreshResult.error.type,
      };
    }

    set({ holdings: refreshResult.data, isLoading: false, error: null });
    return { ok: true };
  },
  updateHolding: async (input) => {
    const previousHoldings = get().holdings;
    const updatedHoldings = previousHoldings.map((holding) =>
      holding.id === input.id
        ? {
            ...holding,
            shares: input.shares,
            acquisition_price: input.acquisition_price ?? null,
            account_type: input.account_type,
          }
        : holding
    );

    set({ holdings: updatedHoldings, isLoading: true, error: null });

    const updateResult = await updateHoldingApi(input);
    if (!updateResult.ok) {
      const authToast = resolveAuthToastMessage(
        updateResult.error.type,
        updateResult.error.message
      );
      set({
        holdings: previousHoldings,
        isLoading: false,
        error: updateResult.error.message,
      });
      if (authToast) {
        pushToast(authToast, 'error');
      }
      return {
        ok: false,
        error: updateResult.error.message,
        errorType: updateResult.error.type,
      };
    }

    set({ isLoading: false, error: null });
    return { ok: true };
  },
  deleteHolding: async (input) => {
    const previousHoldings = get().holdings;
    const updatedHoldings = previousHoldings.filter(
      (holding) => holding.id !== input.id
    );

    set({ holdings: updatedHoldings, isLoading: true, error: null });

    const deleteResult = await deleteHoldingApi(input);
    if (!deleteResult.ok) {
      const authToast = resolveAuthToastMessage(
        deleteResult.error.type,
        deleteResult.error.message
      );
      set({
        holdings: previousHoldings,
        isLoading: false,
        error: deleteResult.error.message,
      });
      if (authToast) {
        pushToast(authToast, 'error');
      }
      return {
        ok: false,
        error: deleteResult.error.message,
        errorType: deleteResult.error.type,
      };
    }

    set({ isLoading: false, error: null });
    return { ok: true };
  },
}));
