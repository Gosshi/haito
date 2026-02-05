import { describe, it, expect, vi, beforeEach } from 'vitest';

import { POST } from './route';
import type {
  DividendGoalRequest,
  DividendGoalResponse,
  SimulationErrorResponse,
} from '../../../../lib/simulations/types';

vi.mock('../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('../../../../lib/simulations/dividend-goal-sim', () => ({
  runDividendGoalSimulation: vi.fn(),
}));

import { createClient } from '../../../../lib/supabase/server';
import { runDividendGoalSimulation } from '../../../../lib/simulations/dividend-goal-sim';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;
const mockRunSimulation = runDividendGoalSimulation as ReturnType<typeof vi.fn>;

const validRequestBody: DividendGoalRequest = {
  target_annual_dividend: 120000,
  monthly_contribution: 20000,
  horizon_years: 5,
  assumptions: {
    yield_rate: 3.5,
    dividend_growth_rate: 2.1,
    tax_mode: 'after_tax',
  },
};

describe('POST /api/simulations/dividend-goal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は401を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error('Unauthorized'),
        }),
      },
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    const json = (await response.json()) as SimulationErrorResponse;

    expect(response.status).toBe(401);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('JSONが不正な場合は400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal', {
        method: 'POST',
        body: 'invalid json',
      })
    );

    const json = (await response.json()) as SimulationErrorResponse;

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('BAD_REQUEST');
  });

  it('リクエストが不正な場合は400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal', {
        method: 'POST',
        body: JSON.stringify({ target_annual_dividend: 'invalid' }),
      })
    );

    const json = (await response.json()) as SimulationErrorResponse;

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('BAD_REQUEST');
    expect(json.error.message).toContain('試算');
    expect(json.error.message).toContain('前提条件');
    expect(json.error.details).toHaveProperty('issues');
  });

  it('再投資率が範囲外の場合は400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          assumptions: {
            ...validRequestBody.assumptions,
            reinvest_rate: 1.5,
          },
        }),
      })
    );

    const json = (await response.json()) as SimulationErrorResponse;

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('BAD_REQUEST');
  });

  it('freeプランでは再投資率と税区分を丸めて計算に渡す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', app_metadata: { plan: 'free' } } },
          error: null,
        }),
      },
    });

    mockRunSimulation.mockResolvedValue({
      ok: true,
      data: {
        snapshot: null,
        result: null,
        series: [],
        recommendations: [],
      },
    });

    await POST(
      new Request('http://localhost/api/simulations/dividend-goal', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          assumptions: {
            ...validRequestBody.assumptions,
            reinvest_rate: 0.4,
            account_type: 'taxable',
          },
        }),
      })
    );

    expect(mockRunSimulation).toHaveBeenCalledWith(
      expect.objectContaining({
        assumptions: expect.objectContaining({
          reinvest_rate: 1,
          account_type: 'nisa',
        }),
      })
    );
  });

  it('シミュレーションエラー時は500を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockRunSimulation.mockResolvedValue({
      ok: false,
      error: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Simulation failed.',
          details: null,
        },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    const json = (await response.json()) as SimulationErrorResponse;

    expect(response.status).toBe(500);
    expect(json.error.code).toBe('INTERNAL_ERROR');
  });

  it('計算不正のシミュレーションエラーは400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockRunSimulation.mockResolvedValue({
      ok: false,
      error: {
        error: {
          code: 'BAD_REQUEST',
          message: '試算の前提条件が不正です。',
          details: null,
        },
      },
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    const json = (await response.json()) as SimulationErrorResponse;

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('BAD_REQUEST');
  });

  it('成功時に200と結果を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    const mockResponse: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 180000, current_yield_rate: 3.2 },
      result: {
        achieved: false,
        achieved_in_year: null,
        gap_now: 300000,
        end_annual_dividend: 900000,
        target_annual_dividend: 1200000,
      },
      series: [{ year: new Date().getFullYear(), annual_dividend: 180000 }],
      recommendations: [],
    };

    mockRunSimulation.mockResolvedValue({
      ok: true,
      data: mockResponse,
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    const json = (await response.json()) as DividendGoalResponse;

    expect(response.status).toBe(200);
    expect(json.snapshot?.current_annual_dividend).toBe(180000);
  });
});
