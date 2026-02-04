import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useScenarioCompareStore } from './scenario-compare-store';
import { runDividendGoalScenarioCompare } from '../lib/api/simulations';
import type {
  DividendGoalRequest,
  DividendGoalScenarioCompareRequest,
  DividendGoalScenarioCompareResponse,
  SimulationErrorResponse,
  SimulationResult,
} from '../lib/simulations/types';

vi.mock('../lib/api/simulations');

describe('useScenarioCompareStore', () => {
  const mockInput: DividendGoalScenarioCompareRequest = {
    target_annual_dividend: 1000000,
    monthly_contribution: 30000,
    horizon_years: 5,
  };

  const mockRoadmapInput: DividendGoalRequest = {
    target_annual_dividend: 1200000,
    monthly_contribution: 40000,
    horizon_years: 7,
    assumptions: {
      yield_rate: 3.5,
      dividend_growth_rate: 2.0,
      tax_mode: 'after_tax',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useScenarioCompareStore.setState({
      input: null,
      response: null,
      error: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets the initial state', () => {
    const state = useScenarioCompareStore.getState();

    expect(state.input).toBeNull();
    expect(state.response).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('updates input and response on success', async () => {
    const mockResponse: DividendGoalScenarioCompareResponse = {
      scenarios: [
        {
          scenario_id: 'stable',
          name: 'Stable',
          assumptions: {
            yield_rate: 3.5,
            dividend_growth_rate: 2.0,
            tax_mode: 'after_tax',
          },
          result: { achieved: false, achieved_in_year: null },
          series: [{ year: 2026, annual_dividend: 200000 }],
        },
      ],
    };

    vi.mocked(runDividendGoalScenarioCompare).mockResolvedValueOnce({
      ok: true,
      data: mockResponse,
    });

    await useScenarioCompareStore.getState().runScenarioCompare(mockInput);

    const state = useScenarioCompareStore.getState();
    expect(state.input).toEqual(mockInput);
    expect(state.response).toEqual(mockResponse);
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('updates error on failure', async () => {
    const errorResponse: SimulationErrorResponse = {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
        details: null,
      },
    };

    vi.mocked(runDividendGoalScenarioCompare).mockResolvedValueOnce({
      ok: false,
      error: errorResponse,
    });

    await useScenarioCompareStore.getState().runScenarioCompare(mockInput);

    const state = useScenarioCompareStore.getState();
    expect(state.input).toEqual(mockInput);
    expect(state.error).toEqual(errorResponse);
    expect(state.isLoading).toBe(false);
  });

  it('sets isLoading while running', async () => {
    let resolvePromise: (
      value: SimulationResult<DividendGoalScenarioCompareResponse>
    ) => void;
    const pending = new Promise<
      SimulationResult<DividendGoalScenarioCompareResponse>
    >((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(runDividendGoalScenarioCompare).mockReturnValueOnce(pending);

    const runPromise = useScenarioCompareStore.getState().runScenarioCompare(
      mockInput
    );

    expect(useScenarioCompareStore.getState().isLoading).toBe(true);

    resolvePromise!({ ok: true, data: { scenarios: [] } });
    await runPromise;

    expect(useScenarioCompareStore.getState().isLoading).toBe(false);
  });

  it('applies only the latest request result', async () => {
    let resolveFirst: (
      value: SimulationResult<DividendGoalScenarioCompareResponse>
    ) => void;
    let resolveSecond: (
      value: SimulationResult<DividendGoalScenarioCompareResponse>
    ) => void;

    const firstPromise = new Promise<
      SimulationResult<DividendGoalScenarioCompareResponse>
    >((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise<
      SimulationResult<DividendGoalScenarioCompareResponse>
    >((resolve) => {
      resolveSecond = resolve;
    });

    vi.mocked(runDividendGoalScenarioCompare)
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const firstRun = useScenarioCompareStore.getState().runScenarioCompare({
      ...mockInput,
      target_annual_dividend: 900000,
    });
    const secondRun = useScenarioCompareStore.getState().runScenarioCompare({
      ...mockInput,
      target_annual_dividend: 1100000,
    });

    resolveSecond!({
      ok: true,
      data: {
        scenarios: [
          {
            scenario_id: 'growth',
            name: 'Growth',
            assumptions: {
              yield_rate: 3.0,
              dividend_growth_rate: 3.0,
              tax_mode: 'after_tax',
            },
            result: {},
            series: [],
          },
        ],
      },
    });
    await secondRun;

    resolveFirst!({
      ok: true,
      data: {
        scenarios: [
          {
            scenario_id: 'stable',
            name: 'Stable',
            assumptions: {
              yield_rate: 3.5,
              dividend_growth_rate: 2.0,
              tax_mode: 'after_tax',
            },
            result: {},
            series: [],
          },
        ],
      },
    });
    await firstRun;

    const state = useScenarioCompareStore.getState();
    expect(state.response?.scenarios[0]?.scenario_id).toBe('growth');
  });

  it('maps roadmap input to compare input', () => {
    useScenarioCompareStore.getState().setInputFromRoadmap(mockRoadmapInput);

    const state = useScenarioCompareStore.getState();
    expect(state.input).toEqual({
      target_annual_dividend: 1200000,
      monthly_contribution: 40000,
      horizon_years: 7,
    });
  });

  it('treats missing scenarios as an error', async () => {
    vi.mocked(runDividendGoalScenarioCompare).mockResolvedValueOnce({
      ok: true,
      data: {} as DividendGoalScenarioCompareResponse,
    });

    await useScenarioCompareStore.getState().runScenarioCompare(mockInput);

    const state = useScenarioCompareStore.getState();
    expect(state.response).toBeNull();
    expect(state.error?.error.code).toBe('INVALID_RESPONSE');
  });
});
