'use client';

import { create } from 'zustand';

import type {
  DividendGoalShockRequest,
  DividendGoalShockResponse,
  SimulationErrorResponse,
} from '../lib/simulations/types';
import { runDividendGoalShock } from '../lib/api/simulations';
import { useFeatureAccessStore } from './feature-access-store';

export type RoadmapShockState = {
  input: DividendGoalShockRequest | null;
  response: DividendGoalShockResponse | null;
  error: SimulationErrorResponse | null;
  isLoading: boolean;
  runShock: (input: DividendGoalShockRequest) => Promise<void>;
};

const isValidShockResponse = (
  response: DividendGoalShockResponse | null
): response is DividendGoalShockResponse => {
  return Boolean(response?.base) && Boolean(response?.shocked);
};

const buildInvalidResponseError = (): SimulationErrorResponse => ({
  error: {
    code: 'INVALID_RESPONSE',
    message: 'Shock data is missing.',
    details: null,
  },
});

let latestRequestId = 0;

export const useRoadmapShockStore = create<RoadmapShockState>((set) => ({
  input: null,
  response: null,
  error: null,
  isLoading: false,
  runShock: async (input) => {
    const requestId = (latestRequestId += 1);
    set({ input, isLoading: true, error: null, response: null });

    const result = await runDividendGoalShock(input);

    if (requestId !== latestRequestId) {
      return;
    }

    if (!result.ok) {
      if (result.error.error.code === 'FORBIDDEN') {
        useFeatureAccessStore
          .getState()
          .lockFeature('stress_test', 'forbidden');
      }
      set({ error: result.error, response: null, isLoading: false });
      return;
    }

    if (!isValidShockResponse(result.data)) {
      set({
        response: null,
        error: buildInvalidResponseError(),
        isLoading: false,
      });
      return;
    }

    set({ response: result.data, error: null, isLoading: false });
  },
}));
