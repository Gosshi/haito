import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useRoadmapStore } from './roadmap-store';
import * as historyStore from './roadmap-history-store';
import { runRoadmapSimulation } from '../lib/simulations/roadmap';
import type {
  DividendGoalRequest,
  DividendGoalResponse,
  SimulationErrorResponse,
  SimulationResult,
} from '../lib/simulations/types';

vi.mock('../lib/simulations/roadmap');
vi.mock('./roadmap-history-store', () => ({
  useRoadmapHistoryStore: {
    getState: vi.fn(),
  },
}));

describe('useRoadmapStore', () => {
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

  let mockSaveHistory: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSaveHistory = vi.fn().mockResolvedValue({ ok: true });
    vi.mocked(historyStore.useRoadmapHistoryStore.getState).mockReturnValue({
      saveHistory: mockSaveHistory,
    } as unknown as ReturnType<typeof historyStore.useRoadmapHistoryStore.getState>);
    useRoadmapStore.setState({
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
    const state = useRoadmapStore.getState();

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

    vi.mocked(runRoadmapSimulation).mockResolvedValueOnce({
      ok: true,
      data: mockResponse,
    });

    await useRoadmapStore.getState().runRoadmap(mockInput);

    const state = useRoadmapStore.getState();
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

    vi.mocked(runRoadmapSimulation).mockResolvedValueOnce({
      ok: false,
      error: errorResponse,
    });

    await useRoadmapStore.getState().runRoadmap(mockInput);

    const state = useRoadmapStore.getState();
    expect(state.input).toEqual(mockInput);
    expect(state.error).toEqual(errorResponse);
    expect(state.isLoading).toBe(false);
    expect(mockSaveHistory).not.toHaveBeenCalled();
  });

  it('実行中はisLoadingがtrueになる', async () => {
    let resolvePromise: (value: SimulationResult<DividendGoalResponse>) => void;
    const pending = new Promise<SimulationResult<DividendGoalResponse>>(
      (resolve) => {
        resolvePromise = resolve;
      }
    );

    vi.mocked(runRoadmapSimulation).mockReturnValueOnce(pending);

    const runPromise = useRoadmapStore.getState().runRoadmap(mockInput);

    expect(useRoadmapStore.getState().isLoading).toBe(true);

    resolvePromise!({ ok: true, data: { snapshot: null } });
    await runPromise;

    expect(useRoadmapStore.getState().isLoading).toBe(false);
  });

  it('成功時に履歴保存を実行する', async () => {
    const mockResponse: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 120000, current_yield_rate: 3.2 },
      result: { target_annual_dividend: 1000000 },
      series: [{ year: 2026, annual_dividend: 180000 }],
    };

    vi.mocked(runRoadmapSimulation).mockResolvedValueOnce({
      ok: true,
      data: mockResponse,
    });

    await useRoadmapStore.getState().runRoadmap(mockInput);

    expect(mockSaveHistory).toHaveBeenCalledWith({
      input: mockInput,
      summary: {
        snapshot: mockResponse.snapshot ?? null,
        result: mockResponse.result ?? null,
      },
      series: mockResponse.series ?? [],
    });
  });
});
