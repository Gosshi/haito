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

const buildDividendSummary = (
  overrides: Partial<{
    totalPreTax: number;
    totalAfterTax: number;
    totalInvestment: number;
  }> = {}
) => ({
  totalPreTax: 200000,
  totalAfterTax: 200000,
  totalInvestment: 1000000,
  dividendYield: 20,
  accountSummaries: [
    { accountType: 'specific', preTax: 200000, afterTax: 200000 },
  ],
  ...overrides,
});

const baseInput: DividendGoalRequest = {
  target_annual_dividend: 100000,
  monthly_contribution: 0,
  horizon_years: 2,
  assumptions: {
    yield_rate: 3.5,
    dividend_growth_rate: 0,
    tax_mode: 'after_tax',
    reinvest_rate: 1,
    account_type: 'nisa',
  },
};

describe('runDividendGoalSimulation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('資本ベースの再投資・税区分を反映したseriesを返す', async () => {
    const currentYear = new Date().getFullYear();
    mockFetchDashboardData.mockResolvedValue({
      ok: true,
      data: { holdings: [], missingDividendCodes: [] },
    });
    mockCalculateDividendSummary.mockReturnValue(
      buildDividendSummary({
        totalPreTax: 100000,
        totalAfterTax: 80000,
        totalInvestment: 1000000,
      })
    );

    const result = await runDividendGoalSimulation({
      ...baseInput,
      assumptions: {
        ...baseInput.assumptions,
        yield_rate: 10,
        reinvest_rate: 1,
        account_type: 'taxable',
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.series).toEqual([
      { year: currentYear, annual_dividend: 100000 },
      { year: currentYear + 1, annual_dividend: 107969 },
      { year: currentYear + 2, annual_dividend: 116572 },
    ]);
  });

  it('tax_modeの違いが計算結果に影響しない', async () => {
    mockFetchDashboardData.mockResolvedValue({
      ok: true,
      data: { holdings: [], missingDividendCodes: [] },
    });
    mockCalculateDividendSummary.mockReturnValue(
      buildDividendSummary({
        totalPreTax: 100000,
        totalAfterTax: 80000,
        totalInvestment: 1000000,
      })
    );

    const baseAssumptions = {
      yield_rate: 10,
      dividend_growth_rate: 0,
      reinvest_rate: 1,
      account_type: 'taxable',
    } as const;

    const afterTaxResult = await runDividendGoalSimulation({
      ...baseInput,
      assumptions: {
        ...baseAssumptions,
        tax_mode: 'after_tax',
      },
    });
    const preTaxResult = await runDividendGoalSimulation({
      ...baseInput,
      assumptions: {
        ...baseAssumptions,
        tax_mode: 'pretax',
      },
    });

    expect(afterTaxResult.ok).toBe(true);
    expect(preTaxResult.ok).toBe(true);
    if (!afterTaxResult.ok || !preTaxResult.ok) return;

    expect(preTaxResult.data.series).toEqual(afterTaxResult.data.series);
  });

  it('ショックが指定年以降に永続的に反映される', async () => {
    const currentYear = new Date().getFullYear();
    mockFetchDashboardData.mockResolvedValue({
      ok: true,
      data: { holdings: [], missingDividendCodes: [] },
    });
    mockCalculateDividendSummary.mockReturnValue(
      buildDividendSummary({
        totalPreTax: 100000,
        totalAfterTax: 100000,
        totalInvestment: 1000000,
      })
    );

    const result = await runDividendGoalSimulation(
      {
        ...baseInput,
        assumptions: {
          ...baseInput.assumptions,
          yield_rate: 10,
          reinvest_rate: 0,
          account_type: 'nisa',
        },
      },
      {
        shock: { year: currentYear + 1, rate: 50 },
      }
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.series).toEqual([
      { year: currentYear, annual_dividend: 100000 },
      { year: currentYear + 1, annual_dividend: 50000 },
      { year: currentYear + 2, annual_dividend: 50000 },
    ]);
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

  it('reinvest_rateが0でも例外なくseriesを返す', async () => {
    const currentYear = new Date().getFullYear();
    mockFetchDashboardData.mockResolvedValue({
      ok: true,
      data: { holdings: [], missingDividendCodes: [] },
    });
    mockCalculateDividendSummary.mockReturnValue(
      buildDividendSummary({
        totalPreTax: 100000,
        totalAfterTax: 100000,
        totalInvestment: 1000000,
      })
    );

    const result = await runDividendGoalSimulation({
      ...baseInput,
      horizon_years: 1,
      assumptions: {
        ...baseInput.assumptions,
        yield_rate: 10,
        dividend_growth_rate: 0,
        reinvest_rate: 0,
        account_type: 'nisa',
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.data.series).toEqual([
      { year: currentYear, annual_dividend: 100000 },
      { year: currentYear + 1, annual_dividend: 100000 },
    ]);
  });

  it('金額系の出力は整数円になる', async () => {
    mockFetchDashboardData.mockResolvedValue({
      ok: true,
      data: { holdings: [], missingDividendCodes: [] },
    });
    mockCalculateDividendSummary.mockReturnValue(
      buildDividendSummary({
        totalPreTax: 100000,
        totalAfterTax: 100000,
        totalInvestment: 1000000,
      })
    );

    const result = await runDividendGoalSimulation({
      ...baseInput,
      target_annual_dividend: 100000.4,
      assumptions: {
        ...baseInput.assumptions,
        yield_rate: 3.5,
        dividend_growth_rate: 0,
        reinvest_rate: 1,
        account_type: 'nisa',
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { result: summary, snapshot, series } = result.data;
    expect(Number.isInteger(summary?.gap_now ?? 0)).toBe(true);
    expect(Number.isInteger(summary?.end_annual_dividend ?? 0)).toBe(true);
    expect(Number.isInteger(summary?.target_annual_dividend ?? 0)).toBe(true);
    expect(Number.isInteger(snapshot?.current_annual_dividend ?? 0)).toBe(true);
    expect(series?.every((point) => Number.isInteger(point.annual_dividend))).toBe(
      true
    );
  });

  it('NaNが入力に含まれる場合はBAD_REQUESTを返す', async () => {
    mockFetchDashboardData.mockResolvedValue({
      ok: true,
      data: { holdings: [], missingDividendCodes: [] },
    });
    mockCalculateDividendSummary.mockReturnValue(buildDividendSummary());

    const result = await runDividendGoalSimulation({
      ...baseInput,
      assumptions: {
        ...baseInput.assumptions,
        yield_rate: Number.NaN,
      },
    } as DividendGoalRequest);

    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.error.code).toBe('BAD_REQUEST');
  });
});
