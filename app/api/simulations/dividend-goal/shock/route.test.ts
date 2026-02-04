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
        end_annual_dividend: 100000,
        target_annual_dividend: 120000,
      },
      series: [{ year: new Date().getFullYear(), annual_dividend: 100000 }],
    };

    mockRunSimulation.mockResolvedValue({
      ok: true,
      data: baseResponse,
    });

    const response = await POST(
      new Request('http://localhost/api/simulations/dividend-goal/shock', {
        method: 'POST',
        body: JSON.stringify(validRequestBody),
      })
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as { base?: unknown };
    expect(json.base).toEqual(baseResponse);
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
});
