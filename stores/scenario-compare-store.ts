'use client';

import { create } from 'zustand';

import type {
  DividendGoalRequest,
  DividendGoalScenarioCompareRequest,
  DividendGoalScenarioCompareResponse,
  SimulationErrorResponse,
} from '../lib/simulations/types';
import { runDividendGoalScenarioCompare } from '../lib/api/simulations';

export type ScenarioCompareState = {
  input: DividendGoalScenarioCompareRequest | null;
  response: DividendGoalScenarioCompareResponse | null;
  error: SimulationErrorResponse | null;
  isLoading: boolean;
  runScenarioCompare: (input: DividendGoalScenarioCompareRequest) => Promise<void>;
  setInputFromRoadmap: (input: DividendGoalRequest | null) => void;
};

const buildCompareInput = (
  input: DividendGoalRequest | null
): DividendGoalScenarioCompareRequest | null => {
  if (!input) {
    return null;
  }

  return {
    target_annual_dividend: input.target_annual_dividend,
    monthly_contribution: input.monthly_contribution,
    horizon_years: input.horizon_years,
  };
};

const isValidScenarioCompareResponse = (
  response: DividendGoalScenarioCompareResponse | null
): response is DividendGoalScenarioCompareResponse => {
  return Boolean(response) && Array.isArray(response?.scenarios);
};

const buildInvalidResponseError = (): SimulationErrorResponse => ({
  error: {
    code: 'INVALID_RESPONSE',
    message: 'Scenario data is missing.',
    details: null,
  },
});

let latestRequestId = 0;

export const useScenarioCompareStore = create<ScenarioCompareState>((set) => ({
  input: null,
  response: null,
  error: null,
  isLoading: false,
  runScenarioCompare: async (input) => {
    const requestId = (latestRequestId += 1);
    set({ input, isLoading: true, error: null });

    const result = await runDividendGoalScenarioCompare(input);

    if (requestId !== latestRequestId) {
      return;
    }

    if (!result.ok) {
      set({ error: result.error, isLoading: false });
      return;
    }

    if (!isValidScenarioCompareResponse(result.data)) {
      set({
        response: null,
        error: buildInvalidResponseError(),
        isLoading: false,
      });
      return;
    }

    set({ response: result.data, error: null, isLoading: false });
  },
  setInputFromRoadmap: (input) => {
    set({
      input: buildCompareInput(input),
      response: null,
      error: null,
    });
  },
}));
