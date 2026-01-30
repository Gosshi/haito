'use client';

import { create } from 'zustand';

import type { Holding, NewHolding } from '../lib/holdings/types';
import {
  createHolding,
  fetchHoldings as fetchHoldingsApi,
  type HoldingsErrorType,
} from '../lib/api/holdings';

export type HoldingsActionResult =
  | { ok: true }
  | { ok: false; error: string; errorType: HoldingsErrorType };

type HoldingsState = {
  holdings: Holding[];
  isLoading: boolean;
  error: string | null;
  fetchHoldings: () => Promise<void>;
  addHolding: (input: NewHolding) => Promise<HoldingsActionResult>;
};

export const useHoldingsStore = create<HoldingsState>((set) => ({
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
}));
