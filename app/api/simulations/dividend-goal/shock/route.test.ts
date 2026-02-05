import { describe, it, expect, vi, beforeEach } from 'vitest';

import { POST } from './route';

vi.mock('../../../../../lib/access/access-gate', () => ({
  createAccessGateService: vi.fn(),
}));

vi.mock('../../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('../../../../../lib/simulations/dividend-goal-sim', () => ({
  runDividendGoalSimulation: vi.fn(),
}));

import { createAccessGateService } from '../../../../../lib/access/access-gate';
import { createClient } from '../../../../../lib/supabase/server';
import { runDividendGoalSimulation } from '../../../../../lib/simulations/dividend-goal-sim';

const mockCreateAccessGateService =
  createAccessGateService as ReturnType<typeof vi.fn>;
const mockCreateClient = createClient as ReturnType<typeof vi.fn>;
const mockRunSimulation =
  runDividendGoalSimulation as ReturnType<typeof vi.fn>;

const validRequestBody = {
  target_annual_dividend: 120000,
  monthly_contribution: 20000,
  horizon_years: 5,
  assumptions: {
    yield_rate: 3.5,
    dividend_growth_rate: 2.1,
    tax_mode: 'after_tax',
  },
  shock: {
    year: new Date().getFullYear(),
    rate: 10,
  },
};

describe('DividendGoalShockApi access control', () => {
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
      new Request('http://localhost/api/simulations/dividend-goal/shock', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    expect(response.status).toBe(401);
  });

  it('無料ユーザーは403を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockCreateAccessGateService.mockReturnValue({
      decideAccess: vi.fn().mockResolvedValue({
        allowed: false,
        plan: 'free',
      }),
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal/shock', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    expect(response.status).toBe(403);
  });

  it('有料ユーザーはアクセスできる', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockCreateAccessGateService.mockReturnValue({
      decideAccess: vi.fn().mockResolvedValue({
        allowed: true,
        plan: 'premium',
      }),
    });

    const baseResponse = {
      snapshot: {
        current_annual_dividend: 100000,
        current_yield_rate: 3.2,
      },
      result: {
        achieved: false,
        achieved_in_year: null,
        end_annual_dividend: 150000,
        target_annual_dividend: 120000,
      },
      series: [{ year: new Date().getFullYear(), annual_dividend: 100000 }],
    };

    const shockedResponse = {
      snapshot: {
        current_annual_dividend: 100000,
        current_yield_rate: 3.2,
      },
      result: {
        achieved: false,
        achieved_in_year: 2028,
        end_annual_dividend: 120000,
        target_annual_dividend: 120000,
      },
      series: [{ year: new Date().getFullYear(), annual_dividend: 90000 }],
    };

    mockRunSimulation
      .mockResolvedValueOnce({
        ok: true,
        data: baseResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        data: shockedResponse,
      });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal/shock', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as {
      base?: unknown;
      shocked?: unknown;
      delta?: unknown;
    };
    expect(json.base).toEqual(baseResponse);
    expect(json.shocked).toEqual(shockedResponse);
    expect(json.delta).toEqual({
      achieved_year_delay: null,
      end_annual_dividend_gap: 30000,
    });

    expect(mockRunSimulation).toHaveBeenCalledTimes(2);
    expect(mockRunSimulation.mock.calls[1]?.[1]).toEqual({
      shock: validRequestBody.shock,
    });
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

    mockCreateAccessGateService.mockReturnValue({
      decideAccess: vi.fn().mockResolvedValue({
        allowed: true,
        plan: 'premium',
      }),
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal/shock', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          assumptions: {
            ...validRequestBody.assumptions,
            reinvest_rate: 2,
          },
        }),
      })
    );

    expect(response.status).toBe(400);
  });

  it('shock.year が期間外の場合は400で詳細を返す', async () => {
    const currentYear = new Date().getFullYear();
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockCreateAccessGateService.mockReturnValue({
      decideAccess: vi.fn().mockResolvedValue({
        allowed: true,
        plan: 'premium',
      }),
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal/shock', {
        method: 'POST',
        body: JSON.stringify({
          ...validRequestBody,
          horizon_years: 1,
          shock: { year: currentYear + 2, rate: 10 },
        }),
      })
    );

    const json = (await response.json()) as {
      error: { code: string; message: string; details: { issues?: unknown } };
    };

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('BAD_REQUEST');
    expect(json.error.message).toContain('試算');
    expect(json.error.message).toContain('前提条件');
    expect(json.error.details).toHaveProperty('issues');
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

    mockCreateAccessGateService.mockReturnValue({
      decideAccess: vi.fn().mockResolvedValue({
        allowed: true,
        plan: 'premium',
      }),
    });

    mockRunSimulation.mockResolvedValueOnce({
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
      new Request('http://localhost/api/simulations/dividend-goal/shock', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    expect(response.status).toBe(400);
  });

  it('シミュレーションが失敗した場合は500を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
          error: null,
        }),
      },
    });

    mockCreateAccessGateService.mockReturnValue({
      decideAccess: vi.fn().mockResolvedValue({
        allowed: true,
        plan: 'premium',
      }),
    });

    mockRunSimulation.mockResolvedValueOnce({
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
      new Request('http://localhost/api/simulations/dividend-goal/shock', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    expect(response.status).toBe(500);
  });
});
