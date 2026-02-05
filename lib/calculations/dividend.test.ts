import { describe, expect, it } from 'vitest';

import type { DashboardHolding } from '../dashboard/types';
import { calculateDividendSummary } from './dividend';

describe('calculateDividendSummary', () => {
  it('旧NISAの配当を税引きなしで集計する', () => {
    const holdings: DashboardHolding[] = [
      {
        id: 'h1',
        stock_code: '7203',
        stock_name: 'トヨタ',
        shares: 10,
        acquisition_price: 100,
        account_type: 'specific',
        annual_dividend: 10,
      },
      {
        id: 'h2',
        stock_code: '8306',
        stock_name: '三菱UFJ',
        shares: 10,
        acquisition_price: 100,
        account_type: 'nisa_legacy',
        annual_dividend: 20,
      },
    ];

    const summary = calculateDividendSummary(holdings);

    expect(summary.totalPreTax).toBe(300);
    expect(summary.totalAfterTax).toBe(279);
    expect(summary.totalInvestment).toBe(2000);
    expect(summary.dividendYield).toBeCloseTo(15, 5);

    const legacy = summary.accountSummaries.find(
      (entry) => entry.accountType === 'nisa_legacy'
    );
    expect(legacy).toEqual({
      accountType: 'nisa_legacy',
      preTax: 200,
      afterTax: 200,
    });
  });
});
