import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import type { DividendGoalShockResponse } from '../../../../../lib/simulations/types';

vi.mock('../../../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '../../../../../lib/supabase/server';

const mockCreateClient = createClient as ReturnType<typeof vi.fn>;

const buildRequest = (body: unknown) =>
  new Request(
    'http://localhost:3000/api/simulations/dividend-goal/shock',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

describe('POST /api/simulations/dividend-goal/shock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (vi.isFakeTimers()) {
      vi.useRealTimers();
    }
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
      buildRequest({
        target_annual_dividend: 1000000,
        monthly_contribution: 30000,
        horizon_years: 5,
        assumptions: {
          yield_rate: 3.5,
          dividend_growth_rate: 2.0,
          tax_mode: 'after_tax',
        },
        shock: { year: 2027, rate: 25 },
      })
    );

    const json = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(401);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });

  it('無料ユーザーの場合は403を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', app_metadata: { plan: 'free' } } },
          error: null,
        }),
      },
    });

    const response = await POST(
      buildRequest({
        target_annual_dividend: 1000000,
        monthly_contribution: 30000,
        horizon_years: 5,
        assumptions: {
          yield_rate: 3.5,
          dividend_growth_rate: 2.0,
          tax_mode: 'after_tax',
        },
        shock: { year: 2027, rate: 25 },
      })
    );

    const json = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(403);
    expect(json.error.code).toBe('FORBIDDEN');
  });

  it('減配率が範囲外の場合は400を返す', async () => {
    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', app_metadata: { plan: 'premium' } } },
          error: null,
        }),
      },
    });

    const response = await POST(
      buildRequest({
        target_annual_dividend: 1000000,
        monthly_contribution: 30000,
        horizon_years: 5,
        assumptions: {
          yield_rate: 3.5,
          dividend_growth_rate: 2.0,
          tax_mode: 'after_tax',
        },
        shock: { year: 2027, rate: 120 },
      })
    );

    const json = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('BAD_REQUEST');
  });

  it('減配年が期間外の場合は400を返す', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', app_metadata: { plan: 'premium' } } },
          error: null,
        }),
      },
    });

    const response = await POST(
      buildRequest({
        target_annual_dividend: 1000000,
        monthly_contribution: 30000,
        horizon_years: 1,
        assumptions: {
          yield_rate: 3.5,
          dividend_growth_rate: 2.0,
          tax_mode: 'after_tax',
        },
        shock: { year: 2028, rate: 25 },
      })
    );

    const json = (await response.json()) as { error: { code: string } };

    expect(response.status).toBe(400);
    expect(json.error.code).toBe('BAD_REQUEST');
  });

  it('入力が正しい場合はbase/shockedと差分を返す', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    mockCreateClient.mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-123', app_metadata: { plan: 'premium' } } },
          error: null,
        }),
      },
    });

    const response = await POST(
      buildRequest({
        target_annual_dividend: 100,
        monthly_contribution: 0,
        horizon_years: 2,
        assumptions: {
          yield_rate: 3.5,
          dividend_growth_rate: 2.0,
          tax_mode: 'after_tax',
        },
        shock: { year: 2027, rate: 50 },
      })
    );

    const json = (await response.json()) as DividendGoalShockResponse;

    expect(response.status).toBe(200);
    expect(json.base.series?.length).toBe(3);
    expect(json.shocked.series?.[1]?.annual_dividend).toBe(25);
    expect(json.shocked.series?.[2]?.annual_dividend).toBe(50);
    expect(json.delta.end_annual_dividend_gap).toBe(50);
    expect(json.delta.achieved_year_delay).toBeNull();
  });
});
