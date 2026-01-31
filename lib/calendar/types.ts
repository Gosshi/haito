import type { AccountType } from '../holdings/types';

export type CalendarHolding = {
  id: string;
  stock_code: string;
  stock_name: string | null;
  shares: number;
  account_type: AccountType;
  annual_dividend: number | null;
  payment_months: number[] | null;
};

export type CalendarData = {
  holdings: CalendarHolding[];
};

export type CalendarErrorType = 'unauthorized' | 'unknown';

export type CalendarResult =
  | { ok: true; data: CalendarData }
  | { ok: false; error: { type: CalendarErrorType; message: string } };

export type MonthDividendEntry = {
  stockCode: string;
  stockName: string | null;
  accountType: AccountType;
  amount: number;
};

export type MonthData = {
  month: number;
  entries: MonthDividendEntry[];
  total: number;
};

export type UnknownMonthHolding = {
  stockCode: string;
  stockName: string | null;
  accountType: AccountType;
  annualDividendAfterTax: number;
};

export type MonthlyDividendResult = {
  months: MonthData[];
  unknownMonthHoldings: UnknownMonthHolding[];
  unknownMonthTotal: number;
  yearTotal: number;
};
