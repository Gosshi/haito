import { createClient } from '../supabase/server';

import type { CalendarData, CalendarHolding, CalendarResult } from '../calendar/types';
import type { AccountType } from '../holdings/types';

type HoldingRow = {
  id?: unknown;
  stock_code?: unknown;
  stock_name?: unknown;
  shares?: unknown;
  account_type?: unknown;
};

type DividendRow = {
  stock_code?: unknown;
  annual_dividend?: unknown;
  payment_months?: unknown;
};

const accountTypeValues: AccountType[] = [
  'specific',
  'nisa_growth',
  'nisa_tsumitate',
  'nisa_legacy',
];

const isAccountType = (value: unknown): value is AccountType =>
  typeof value === 'string' &&
  accountTypeValues.includes(value as AccountType);

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toString = (value: unknown): string | null =>
  typeof value === 'string' ? value.trim() : null;

const toNumberArray = (value: unknown): number[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const numbers = value
    .map((item) => toNumber(item))
    .filter((n): n is number => n !== null);

  return numbers.length > 0 ? numbers : null;
};

type NormalizedHolding = {
  id: string;
  stock_code: string;
  stock_name: string | null;
  shares: number;
  account_type: AccountType;
};

const normalizeHolding = (row: HoldingRow): NormalizedHolding | null => {
  const id = toString(row.id);
  const stockCode = toString(row.stock_code);
  const shares = toNumber(row.shares);
  const accountType = isAccountType(row.account_type) ? row.account_type : null;

  if (!id || !stockCode || shares === null || !accountType) {
    return null;
  }

  const stockName = toString(row.stock_name);

  return {
    id,
    stock_code: stockCode,
    stock_name: stockName && stockName.length > 0 ? stockName : null,
    shares,
    account_type: accountType,
  };
};

type NormalizedDividend = {
  code: string;
  annual: number | null;
  paymentMonths: number[] | null;
};

const normalizeDividendRow = (row: DividendRow): NormalizedDividend | null => {
  const stockCode = toString(row.stock_code);
  if (!stockCode) {
    return null;
  }

  return {
    code: stockCode,
    annual: toNumber(row.annual_dividend),
    paymentMonths: toNumberArray(row.payment_months),
  };
};

const uniqueValues = (values: string[]): string[] =>
  Array.from(new Set(values));

export const fetchCalendarData = async (): Promise<CalendarResult> => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;

  if (!user) {
    return {
      ok: false,
      error: { type: 'unauthorized', message: 'Authentication required.' },
    };
  }

  const { data: holdingsData, error: holdingsError } = await supabase
    .from('holdings')
    .select('id, stock_code, stock_name, shares, account_type')
    .eq('user_id', user.id);

  if (holdingsError) {
    return {
      ok: false,
      error: { type: 'unknown', message: holdingsError.message },
    };
  }

  const holdings = (holdingsData ?? [])
    .map((row) => normalizeHolding(row as HoldingRow))
    .filter((row): row is NormalizedHolding => Boolean(row));

  if (holdings.length === 0) {
    return { ok: true, data: { holdings: [] } };
  }

  const stockCodes = uniqueValues(holdings.map((holding) => holding.stock_code));

  const { data: dividendData, error: dividendError } = await supabase
    .from('dividend_data')
    .select('stock_code, annual_dividend, payment_months')
    .in('stock_code', stockCodes);

  if (dividendError) {
    return {
      ok: false,
      error: { type: 'unknown', message: dividendError.message },
    };
  }

  const dividendMap = new Map<string, { annual: number | null; paymentMonths: number[] | null }>();
  (dividendData ?? []).forEach((row) => {
    const normalized = normalizeDividendRow(row as DividendRow);
    if (normalized) {
      dividendMap.set(normalized.code, {
        annual: normalized.annual,
        paymentMonths: normalized.paymentMonths,
      });
    }
  });

  const enrichedHoldings: CalendarHolding[] = holdings.map((holding) => {
    const dividend = dividendMap.get(holding.stock_code);

    return {
      ...holding,
      annual_dividend: dividend?.annual ?? null,
      payment_months: dividend?.paymentMonths ?? null,
    };
  });

  return {
    ok: true,
    data: { holdings: enrichedHoldings },
  };
};
