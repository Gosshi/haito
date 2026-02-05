import { describe, expect, it } from 'vitest';

import type { CalendarHolding } from '../calendar/types';
import { calculateMonthlyDividends } from './monthly-dividend';

describe('calculateMonthlyDividends', () => {
  it('旧NISAの配当を月別集計に含める', () => {
    const holdings: CalendarHolding[] = [
      {
        id: 'h1',
        stock_code: '7203',
        stock_name: 'トヨタ',
        shares: 10,
        account_type: 'specific',
        annual_dividend: 120,
        payment_months: [6, 12],
      },
      {
        id: 'h2',
        stock_code: '8306',
        stock_name: '三菱UFJ',
        shares: 10,
        account_type: 'nisa_legacy',
        annual_dividend: 120,
        payment_months: [6, 12],
      },
    ];

    const result = calculateMonthlyDividends(holdings);

    const june = result.months[5];
    const december = result.months[11];

    expect(june.total).toBe(1078);
    expect(december.total).toBe(1078);
    expect(result.yearTotal).toBe(2156);
    expect(result.unknownMonthHoldings).toHaveLength(0);
  });
});
