'use client';

import { create } from 'zustand';

import type {
  DividendGoalRequest,
  DividendGoalResponse,
  SimulationErrorResponse,
} from '../lib/simulations/types';
import { runRoadmapSimulation } from '../lib/simulations/roadmap';

export type RoadmapState = {
  input: DividendGoalRequest | null;
  response: DividendGoalResponse | null;
  error: SimulationErrorResponse | null;
  isLoading: boolean;
  runRoadmap: (input: DividendGoalRequest) => Promise<void>;
};

export const useRoadmapStore = create<RoadmapState>((set) => ({
  input: null,
  response: null,
  error: null,
  isLoading: false,
  runRoadmap: async (input) => {
    set({ input, isLoading: true, error: null });

    const result = await runRoadmapSimulation(input);

    if (!result.ok) {
      set({ error: result.error, isLoading: false });
      return;
    }

    set({ response: result.data, error: null, isLoading: false });
  },
}));
