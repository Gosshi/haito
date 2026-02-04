import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  runDividendGoalScenarioCompare,
  runDividendGoalShock,
  runDividendGoalSimulation,
} from './simulations';
import type {
  DividendGoalRequest,
  DividendGoalResponse,
  DividendGoalScenarioCompareRequest,
  DividendGoalScenarioCompareResponse,
  DividendGoalShockRequest,
  DividendGoalShockResponse,
} from '../simulations/types';

describe('runDividendGoalSimulation', () => {
  const mockRequest: DividendGoalRequest = {
    target_annual_dividend: 1200000,
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
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('成功時にシミュレーション結果を返す', async () => {
    const mockResponse: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 180000, current_yield_rate: 3.2 },
      result: { achieved: false, achieved_in_year: null, gap_now: 300000 },
      series: [{ year: 1, annual_dividend: 200000 }],
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await runDividendGoalSimulation(mockRequest);

    expect(result).toEqual({ ok: true, data: mockResponse });
    expect(fetch).toHaveBeenCalledWith('/api/simulations/dividend-goal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockRequest),
    });
  });

  it('APIがエラーJSONを返した場合はエラー内容を保持する', async () => {
    const errorResponse = {
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid input',
        details: { field: 'target_annual_dividend' },
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve(errorResponse),
    } as Response);

    const result = await runDividendGoalSimulation(mockRequest);

    expect(result).toEqual({ ok: false, error: errorResponse });
  });

  it('401時はUNAUTHORIZEDとして扱う', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.reject(new Error('invalid json')),
    } as Response);

    const result = await runDividendGoalSimulation(mockRequest);

    expect(result).toEqual({
      ok: false,
      error: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          details: null,
        },
      },
    });
  });

  it('ネットワークエラー時はNETWORK_ERRORとして扱う', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network down'));

    const result = await runDividendGoalSimulation(mockRequest);

    expect(result).toEqual({
      ok: false,
      error: {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network down',
          details: null,
        },
      },
    });
  });
});

describe('runDividendGoalScenarioCompare', () => {
  const mockRequest: DividendGoalScenarioCompareRequest = {
    target_annual_dividend: 1200000,
    monthly_contribution: 30000,
    horizon_years: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('成功時にシナリオ比較結果を返す', async () => {
    const mockResponse: DividendGoalScenarioCompareResponse = {
      scenarios: [
        {
          scenario_id: 'stable',
          name: '安定型',
          assumptions: {
            yield_rate: 3.5,
            dividend_growth_rate: 2.0,
            tax_mode: 'after_tax',
          },
          result: {
            achieved: false,
            achieved_in_year: null,
            end_annual_dividend: 900000,
            target_annual_dividend: 1200000,
          },
          series: [{ year: 2026, annual_dividend: 200000 }],
        },
      ],
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await runDividendGoalScenarioCompare(mockRequest);

    expect(result).toEqual({ ok: true, data: mockResponse });
    expect(fetch).toHaveBeenCalledWith(
      '/api/simulations/dividend-goal/scenarios',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockRequest),
      }
    );
  });

  it('APIがエラーJSONを返した場合はエラー内容を保持する', async () => {
    const errorResponse = {
      error: {
        code: 'BAD_REQUEST',
        message: 'Invalid input',
        details: { field: 'target_annual_dividend' },
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve(errorResponse),
    } as Response);

    const result = await runDividendGoalScenarioCompare(mockRequest);

    expect(result).toEqual({ ok: false, error: errorResponse });
  });

  it('401時はUNAUTHORIZEDとして扱う', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: () => Promise.reject(new Error('invalid json')),
    } as Response);

    const result = await runDividendGoalScenarioCompare(mockRequest);

    expect(result).toEqual({
      ok: false,
      error: {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required.',
          details: null,
        },
      },
    });
  });

  it('ネットワークエラー時はNETWORK_ERRORとして扱う', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network down'));

    const result = await runDividendGoalScenarioCompare(mockRequest);

    expect(result).toEqual({
      ok: false,
      error: {
        error: {
          code: 'NETWORK_ERROR',
          message: 'Network down',
          details: null,
        },
      },
    });
  });
});

describe('runDividendGoalShock', () => {
  const mockRequest: DividendGoalShockRequest = {
    target_annual_dividend: 1200000,
    monthly_contribution: 30000,
    horizon_years: 5,
    assumptions: {
      yield_rate: 3.5,
      dividend_growth_rate: 2.0,
      tax_mode: 'after_tax',
    },
    shock: { year: 2027, rate: 25 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('成功時にストレステスト結果を返す', async () => {
    const mockResponse: DividendGoalShockResponse = {
      base: { result: {}, series: [] },
      shocked: { result: {}, series: [] },
      delta: {
        achieved_year_delay: null,
        end_annual_dividend_gap: null,
      },
    };

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const result = await runDividendGoalShock(mockRequest);

    expect(result).toEqual({ ok: true, data: mockResponse });
    expect(fetch).toHaveBeenCalledWith('/api/simulations/dividend-goal/shock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockRequest),
    });
  });

  it('403時はFORBIDDENとして扱う', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: () => Promise.reject(new Error('invalid json')),
    } as Response);

    const result = await runDividendGoalShock(mockRequest);

    expect(result).toEqual({
      ok: false,
      error: {
        error: {
          code: 'FORBIDDEN',
          message: 'Access forbidden.',
          details: null,
        },
      },
    });
  });
});
