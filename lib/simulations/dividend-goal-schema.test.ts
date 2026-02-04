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
});
