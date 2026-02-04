import { describe, it, expect, vi, beforeEach } from 'vitest';

import { runDividendGoalSimulation } from './dividend-goal-sim';
import type { DividendGoalRequest } from './types';

vi.mock('../api/dashboard', () => ({
  fetchDashboardData: vi.fn(),
}));

vi.mock('../calculations/dividend', () => ({
  calculateDividendSummary: vi.fn(),
}));

import { fetchDashboardData } from '../api/dashboard';
import { calculateDividendSummary } from '../calculations/dividend';

const mockFetchDashboardData = fetchDashboardData as ReturnType<typeof vi.fn>;
const mockCalculateDividendSummary =
  calculateDividendSummary as ReturnType<typeof vi.fn>;

const buildDividendSummary = () => ({
  totalPreTax: 200000,
  totalAfterTax: 200000,
  totalInvestment: 1000000,
  dividendYield: 20,
  accountSummaries: [
    { accountType: 'specific', preTax: 200000, afterTax: 200000 },
  ],
});

const baseInput: DividendGoalRequest = {
  target_annual_dividend: 100000,
  monthly_contribution: 0,
  horizon_years: 2,
  assumptions: {
    yield_rate: 3.5,
    dividend_growth_rate: 0,
    tax_mode: 'after_tax',
  },
};

describe('runDividendGoalSimulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('seriesが1年以上分生成され、達成判定が返る', async () => {
    mockFetchDashboardData.mockResolvedValue({
      ok: true,
      data: { holdings: [], missingDividendCodes: [] },
    });
    mockCalculateDividendSummary.mockReturnValue(buildDividendSummary());

    const result = await runDividendGoalSimulation(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.series).toHaveLength(3);
    expect(result.data.result?.achieved).toBe(true);
    expect(result.data.result?.gap_now).toBe(0);
    expect(result.data.snapshot?.current_annual_dividend).toBe(200000);
    expect(result.data.snapshot?.current_yield_rate).toBe(20);
  });

  it('recommendationsが2件返る', async () => {
    mockFetchDashboardData.mockResolvedValue({
      ok: true,
      data: { holdings: [], missingDividendCodes: [] },
    });
    mockCalculateDividendSummary.mockReturnValue(buildDividendSummary());

    const result = await runDividendGoalSimulation(baseInput);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const recommendations = result.data.recommendations ?? [];
    expect(recommendations).toHaveLength(2);
    const text = JSON.stringify(recommendations);
    expect(text).not.toContain('銘柄');
    expect(text).not.toContain('売買');
  });

  it('未認証の場合はエラーを返す', async () => {
    mockFetchDashboardData.mockResolvedValue({
      ok: false,
      error: { type: 'unauthorized', message: 'Authentication required.' },
    });

    const result = await runDividendGoalSimulation(baseInput);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.error.code).toBe('UNAUTHORIZED');
  });
});
