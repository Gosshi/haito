import { describe, it, expect } from 'vitest';

import { normalizeDividendGoalAssumptions } from './assumptions-normalizer';
import type { DividendGoalRequest } from './types';

const baseInput: DividendGoalRequest = {
  target_annual_dividend: 120000,
  monthly_contribution: 20000,
  horizon_years: 5,
  assumptions: {
    yield_rate: 3.5,
    dividend_growth_rate: 2.1,
    tax_mode: 'after_tax',
    reinvest_rate: 0.4,
    account_type: 'taxable',
  },
};

describe('normalizeDividendGoalAssumptions', () => {
  it('freeプランでは再投資率と税区分を丸める', () => {
    const { assumptions, request } = normalizeDividendGoalAssumptions(
      baseInput,
      'free'
    );

    expect(assumptions.reinvest_rate).toBe(1);
    expect(assumptions.account_type).toBe('nisa');
    expect(request.assumptions.reinvest_rate).toBe(1);
    expect(request.assumptions.account_type).toBe('nisa');
  });

  it('premiumプランでは指定値を保持する', () => {
    const { assumptions, request } = normalizeDividendGoalAssumptions(
      baseInput,
      'premium'
    );

    expect(assumptions.reinvest_rate).toBe(0.4);
    expect(assumptions.account_type).toBe('taxable');
    expect(request.assumptions.reinvest_rate).toBe(0.4);
    expect(request.assumptions.account_type).toBe('taxable');
  });
});
