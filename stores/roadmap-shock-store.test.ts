import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { useRoadmapShockStore } from './roadmap-shock-store';
import { runDividendGoalShock } from '../lib/api/simulations';
import type {
  DividendGoalShockRequest,
  DividendGoalShockResponse,
  SimulationErrorResponse,
  SimulationResult,
} from '../lib/simulations/types';
import { useFeatureAccessStore } from './feature-access-store';

vi.mock('../lib/api/simulations');
vi.mock('./feature-access-store', () => ({
  useFeatureAccessStore: {
    getState: vi.fn(),
  },
}));

describe('useRoadmapShockStore', () => {
  const mockInput: DividendGoalShockRequest = {
    target_annual_dividend: 1000000,
    monthly_contribution: 30000,
    horizon_years: 5,
    assumptions: {
      yield_rate: 3.5,
      dividend_growth_rate: 2.0,
      tax_mode: 'after_tax',
    },
    shock: {
      year: 2027,
      rate: 25,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useRoadmapShockStore.setState({
      input: null,
      response: null,
      error: null,
      isLoading: false,
    });
    vi.mocked(useFeatureAccessStore.getState).mockReturnValue({
      lockFeature: vi.fn(),
    } as unknown as ReturnType<typeof useFeatureAccessStore.getState>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sets the initial state', () => {
    const state = useRoadmapShockStore.getState();

    expect(state.input).toBeNull();
    expect(state.response).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('updates input and response on success', async () => {
    const mockResponse: DividendGoalShockResponse = {
      base: { result: {}, series: [] },
      shocked: { result: {}, series: [] },
      delta: {
        achieved_year_delay: null,
        end_annual_dividend_gap: null,
      },
    };

    vi.mocked(runDividendGoalShock).mockResolvedValueOnce({
      ok: true,
      data: mockResponse,
    });

    await useRoadmapShockStore.getState().runShock(mockInput);

    const state = useRoadmapShockStore.getState();
    expect(state.input).toEqual(mockInput);
    expect(state.response).toEqual(mockResponse);
    expect(state.error).toBeNull();
    expect(state.isLoading).toBe(false);
  });

  it('clears response and updates error on failure', async () => {
    const errorResponse: SimulationErrorResponse = {
      error: {
        code: 'FORBIDDEN',
        message: 'Access forbidden.',
        details: null,
      },
    };

    useRoadmapShockStore.setState({
      input: mockInput,
      response: {
        base: { result: {}, series: [] },
        shocked: { result: {}, series: [] },
        delta: {
          achieved_year_delay: null,
          end_annual_dividend_gap: null,
        },
      },
      error: null,
      isLoading: false,
    });

    vi.mocked(runDividendGoalShock).mockResolvedValueOnce({
      ok: false,
      error: errorResponse,
    });

    await useRoadmapShockStore.getState().runShock(mockInput);

    const state = useRoadmapShockStore.getState();
    expect(state.response).toBeNull();
    expect(state.error).toEqual(errorResponse);
    expect(state.isLoading).toBe(false);
  });

  it('403時はロック状態を設定する', async () => {
    const errorResponse: SimulationErrorResponse = {
      error: {
        code: 'FORBIDDEN',
        message: 'Access forbidden.',
        details: null,
      },
    };

    const lockFeature = vi.fn();
    vi.mocked(useFeatureAccessStore.getState).mockReturnValue({
      lockFeature,
    } as unknown as ReturnType<typeof useFeatureAccessStore.getState>);

    vi.mocked(runDividendGoalShock).mockResolvedValueOnce({
      ok: false,
      error: errorResponse,
    });

    await useRoadmapShockStore.getState().runShock(mockInput);

    expect(lockFeature).toHaveBeenCalledWith('stress_test', 'forbidden');
  });

  it('sets isLoading while running', async () => {
    let resolvePromise: (
      value: SimulationResult<DividendGoalShockResponse>
    ) => void;
    const pending = new Promise<SimulationResult<DividendGoalShockResponse>>( 
      (resolve) => {
        resolvePromise = resolve;
      }
    );

    vi.mocked(runDividendGoalShock).mockReturnValueOnce(pending);

    const runPromise = useRoadmapShockStore.getState().runShock(mockInput);

    expect(useRoadmapShockStore.getState().isLoading).toBe(true);

    resolvePromise!({
      ok: true,
      data: {
        base: { result: {}, series: [] },
        shocked: { result: {}, series: [] },
        delta: {
          achieved_year_delay: null,
          end_annual_dividend_gap: null,
        },
      },
    });
    await runPromise;

    expect(useRoadmapShockStore.getState().isLoading).toBe(false);
  });

  it('applies only the latest request result', async () => {
    let resolveFirst: (
      value: SimulationResult<DividendGoalShockResponse>
    ) => void;
    let resolveSecond: (
      value: SimulationResult<DividendGoalShockResponse>
    ) => void;

    const firstPromise = new Promise<SimulationResult<DividendGoalShockResponse>>( 
      (resolve) => {
        resolveFirst = resolve;
      }
    );
    const secondPromise = new Promise<SimulationResult<DividendGoalShockResponse>>( 
      (resolve) => {
        resolveSecond = resolve;
      }
    );

    vi.mocked(runDividendGoalShock)
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const firstRun = useRoadmapShockStore.getState().runShock({
      ...mockInput,
      shock: { year: 2027, rate: 10 },
    });
    const secondRun = useRoadmapShockStore.getState().runShock({
      ...mockInput,
      shock: { year: 2028, rate: 30 },
    });

    resolveSecond!({
      ok: true,
      data: {
        base: { result: {}, series: [] },
        shocked: { result: { achieved: true }, series: [] },
        delta: {
          achieved_year_delay: null,
          end_annual_dividend_gap: null,
        },
      },
    });
    await secondRun;

    resolveFirst!({
      ok: true,
      data: {
        base: { result: {}, series: [] },
        shocked: { result: { achieved: false }, series: [] },
        delta: {
          achieved_year_delay: null,
          end_annual_dividend_gap: null,
        },
      },
    });
    await firstRun;

    const state = useRoadmapShockStore.getState();
    expect(state.response?.shocked.result?.achieved).toBe(true);
  });

  it('treats missing base or shocked response as an error', async () => {
    vi.mocked(runDividendGoalShock).mockResolvedValueOnce({
      ok: true,
      data: { base: null } as DividendGoalShockResponse,
    });

    await useRoadmapShockStore.getState().runShock(mockInput);

    const state = useRoadmapShockStore.getState();
    expect(state.response).toBeNull();
    expect(state.error?.error.code).toBe('INVALID_RESPONSE');
  });
});
