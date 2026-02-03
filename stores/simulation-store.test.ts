import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSimulationStore } from './simulation-store';
import * as simulationApi from '../lib/api/simulations';
import type {
  DividendGoalRequest,
  DividendGoalResponse,
  SimulationErrorResponse,
  SimulationResult,
} from '../lib/simulations/types';

vi.mock('../lib/api/simulations');

describe('useSimulationStore', () => {
  const mockInput: DividendGoalRequest = {
    target_annual_dividend: 1000000,
    monthly_contribution: 30000,
    horizon_years: 5,
    assumptions: {
      yield_rate: 3.5,
      dividend_growth_rate: 2.0,
      tax_mode: 'after_tax',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useSimulationStore.setState({
      input: null,
      response: null,
      error: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('初期状態が正しく設定される', () => {
    const state = useSimulationStore.getState();

    expect(state.input).toBeNull();
    expect(state.response).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('成功時に入力と結果を更新する', async () => {
    const mockResponse: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 120000, current_yield_rate: 3.2 },
      result: { achieved: false, achieved_in_year: null, gap_now: 300000 },
    };

    vi.mocked(simulationApi.runDividendGoalSimulation).mockResolvedValueOnce({
      ok: true,
      data: mockResponse,
    });

    await useSimulationStore.getState().runSimulation(mockInput);

    const state = useSimulationStore.getState();
    expect(state.input).toEqual(mockInput);
    expect(state.response).toEqual(mockResponse);
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('エラー時にerrorを更新する', async () => {
    const errorResponse: SimulationErrorResponse = {
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
        details: null,
      },
    };

    vi.mocked(simulationApi.runDividendGoalSimulation).mockResolvedValueOnce({
      ok: false,
      error: errorResponse,
    });

    await useSimulationStore.getState().runSimulation(mockInput);

    const state = useSimulationStore.getState();
    expect(state.input).toEqual(mockInput);
    expect(state.error).toEqual(errorResponse);
    expect(state.isLoading).toBe(false);
  });

  it('実行中はisLoadingがtrueになる', async () => {
    let resolvePromise: (value: SimulationResult<DividendGoalResponse>) => void;
    const pending = new Promise<SimulationResult<DividendGoalResponse>>(
      (resolve) => {
        resolvePromise = resolve;
      }
    );

    vi.mocked(simulationApi.runDividendGoalSimulation).mockReturnValueOnce(pending);

    const runPromise = useSimulationStore.getState().runSimulation(mockInput);

    expect(useSimulationStore.getState().isLoading).toBe(true);

    resolvePromise!({ ok: true, data: { snapshot: null } });
    await runPromise;

    expect(useSimulationStore.getState().isLoading).toBe(false);
  });
});
