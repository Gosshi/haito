import { describe, expect, it } from 'vitest';

import { computeAnnualDividendFromYield } from './yahoo-finance';

describe('computeAnnualDividendFromYield', () => {
  it('uses annualDividendRaw when it is positive', () => {
    expect(computeAnnualDividendFromYield(12, 0.02, 100)).toBe(12);
  });

  it('computes annual dividend from yield fraction when raw dividend is missing', () => {
    const result = computeAnnualDividendFromYield(0, 0.025, 200);
    expect(result).toBe(5);
  });

  it('computes annual dividend from yield percent when yield is over 1', () => {
    const result = computeAnnualDividendFromYield(null, 2.5, 200);
    expect(result).toBe(5);
  });

  it('treats 0.52 as 0.52% when no dividend rate is available', () => {
    const result = computeAnnualDividendFromYield(0, 0.52, 100);
    expect(result).toBe(0.52);
  });

  it('does not compute when yield is unusually high', () => {
    const result = computeAnnualDividendFromYield(0, 52, 200);
    expect(result).toBe(0);
  });

  it('returns raw dividend when yield or price is not available', () => {
    expect(computeAnnualDividendFromYield(0, null, 200)).toBe(0);
    expect(computeAnnualDividendFromYield(null, 0.02, null)).toBe(null);
  });
});
