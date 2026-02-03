'use client';

import { create } from 'zustand';

import type {
  DividendGoalRequest,
  DividendGoalResponse,
  SimulationErrorResponse,
} from '../lib/simulations/types';
import { runDividendGoalSimulation } from '../lib/api/simulations';

export type SimulationState = {
  input: DividendGoalRequest | null;
  response: DividendGoalResponse | null;
  error: SimulationErrorResponse | null;
  isLoading: boolean;
  runSimulation: (input: DividendGoalRequest) => Promise<void>;
};

export const useSimulationStore = create<SimulationState>((set) => ({
  input: null,
  response: null,
  error: null,
  isLoading: false,
  runSimulation: async (input) => {
    set({ input, isLoading: true, error: null });

    const result = await runDividendGoalSimulation(input);

    if (!result.ok) {
      set({ error: result.error, isLoading: false });
      return;
    }

    set({ response: result.data, error: null, isLoading: false });
  },
}));
