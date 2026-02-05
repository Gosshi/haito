import { describe, it, expect } from 'vitest';

import {
  dividendGoalRequestSchema,
  dividendGoalShockRequestSchema,
} from './dividend-goal-schema';

const baseRequest = {
  target_annual_dividend: 120000,
  monthly_contribution: 20000,
  horizon_years: 5,
  assumptions: {
    yield_rate: 3.5,
    dividend_growth_rate: 2.1,
    tax_mode: 'after_tax',
  },
};

describe('dividendGoalRequestSchema', () => {
  it('reinvest_rate と account_type が未指定ならデフォルトを補完する', () => {
    const parsed = dividendGoalRequestSchema.parse(baseRequest);

    expect(parsed.assumptions.reinvest_rate).toBe(1);
    expect(parsed.assumptions.account_type).toBe('nisa');
  });

  it('reinvest_rate が範囲外なら失敗する', () => {
    const result = dividendGoalRequestSchema.safeParse({
      ...baseRequest,
      assumptions: {
        ...baseRequest.assumptions,
        reinvest_rate: 1.5,
      },
    });

    expect(result.success).toBe(false);
  });

  it('account_type が不正なら失敗する', () => {
    const result = dividendGoalRequestSchema.safeParse({
      ...baseRequest,
      assumptions: {
        ...baseRequest.assumptions,
        account_type: 'other',
      },
    });

    expect(result.success).toBe(false);
  });

  it('境界値(0)を許容する', () => {
    const parsed = dividendGoalRequestSchema.parse({
      target_annual_dividend: 0,
      monthly_contribution: 0,
      horizon_years: 0,
      assumptions: {
        yield_rate: 0,
        dividend_growth_rate: 0,
        tax_mode: 'after_tax',
        reinvest_rate: 0,
        account_type: 'nisa',
      },
    });

    expect(parsed.target_annual_dividend).toBe(0);
    expect(parsed.monthly_contribution).toBe(0);
    expect(parsed.horizon_years).toBe(0);
    expect(parsed.assumptions.yield_rate).toBe(0);
    expect(parsed.assumptions.dividend_growth_rate).toBe(0);
    expect(parsed.assumptions.reinvest_rate).toBe(0);
  });

  it.each([
    {
      label: 'target_annual_dividend',
      body: { target_annual_dividend: 5_000_001 },
    },
    {
      label: 'monthly_contribution',
      body: { monthly_contribution: 200_001 },
    },
    {
      label: 'horizon_years',
      body: { horizon_years: 41 },
    },
    {
      label: 'yield_rate',
      body: { assumptions: { yield_rate: 10.1 } },
    },
    {
      label: 'dividend_growth_rate',
      body: { assumptions: { dividend_growth_rate: 10.1 } },
    },
    {
      label: 'reinvest_rate',
      body: { assumptions: { reinvest_rate: 1.1 } },
    },
  ])('%s が上限超過の場合は失敗する', ({ body }) => {
    const result = dividendGoalRequestSchema.safeParse({
      ...baseRequest,
      ...body,
      assumptions: {
        ...baseRequest.assumptions,
        ...(body.assumptions ?? {}),
      },
    });

    expect(result.success).toBe(false);
  });

  it.each([
    {
      label: 'target_annual_dividend',
      body: { target_annual_dividend: Number.NaN },
    },
    {
      label: 'monthly_contribution',
      body: { monthly_contribution: Number.POSITIVE_INFINITY },
    },
    {
      label: 'yield_rate',
      body: { assumptions: { yield_rate: Number.NaN } },
    },
  ])('%s がNaN/Infinityの場合は失敗する', ({ body }) => {
    const result = dividendGoalRequestSchema.safeParse({
      ...baseRequest,
      ...body,
      assumptions: {
        ...baseRequest.assumptions,
        ...(body.assumptions ?? {}),
      },
    });

    expect(result.success).toBe(false);
  });
});

describe('dividendGoalShockRequestSchema', () => {
  it('ショック入力でもデフォルトが補完される', () => {
    const parsed = dividendGoalShockRequestSchema.parse({
      ...baseRequest,
      shock: {
        year: 2025,
        rate: 10,
      },
    });

    expect(parsed.assumptions.reinvest_rate).toBe(1);
    expect(parsed.assumptions.account_type).toBe('nisa');
  });

  it.each([
    { label: 'shock.rate', body: { shock: { year: 2025, rate: 101 } } },
    { label: 'shock.year', body: { shock: { year: Number.NaN, rate: 10 } } },
  ])('%s が不正なら失敗する', ({ body }) => {
    const result = dividendGoalShockRequestSchema.safeParse({
      ...baseRequest,
      ...body,
    });

    expect(result.success).toBe(false);
  });
});
