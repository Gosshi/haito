import { createClient } from '../supabase/server';

import type { DashboardData, DashboardHolding } from '../dashboard/types';
import type { AccountType } from '../holdings/types';

export type DashboardErrorType = 'unauthorized' | 'unknown';

export type DashboardResult =
  | { ok: true; data: DashboardData }
  | { ok: false; error: { type: DashboardErrorType; message: string } };

type HoldingRow = {
  id?: unknown;
  stock_code?: unknown;
  stock_name?: unknown;
  shares?: unknown;
  acquisition_price?: unknown;
  account_type?: unknown;
};

type DividendRow = {
  stock_code?: unknown;
  annual_dividend?: unknown;
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

const normalizeHolding = (row: HoldingRow): DashboardHolding | null => {
  const id = toString(row.id);
  const stockCode = toString(row.stock_code);
  const shares = toNumber(row.shares);
  const accountType = isAccountType(row.account_type) ? row.account_type : null;

  if (!id || !stockCode || shares === null || !accountType) {
    return null;
  }

  const stockName = toString(row.stock_name);
  const acquisitionPrice = toNumber(row.acquisition_price);

  return {
    id,
    stock_code: stockCode,
    stock_name: stockName && stockName.length > 0 ? stockName : null,
    shares,
    acquisition_price: acquisitionPrice,
    account_type: accountType,
    annual_dividend: null,
  };
};

const normalizeDividendRow = (row: DividendRow): { code: string; annual: number | null } | null => {
  const stockCode = toString(row.stock_code);
  if (!stockCode) {
    return null;
  }

  return {
    code: stockCode,
    annual: toNumber(row.annual_dividend),
  };
};

const uniqueValues = (values: string[]): string[] =>
  Array.from(new Set(values));

export const fetchDashboardData = async (): Promise<DashboardResult> => {
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
    .select('id, stock_code, stock_name, shares, acquisition_price, account_type')
    .eq('user_id', user.id);

  if (holdingsError) {
    return {
      ok: false,
      error: { type: 'unknown', message: holdingsError.message },
    };
  }

  const holdings = (holdingsData ?? [])
    .map((row) => normalizeHolding(row as HoldingRow))
    .filter((row): row is DashboardHolding => Boolean(row));

  if (holdings.length === 0) {
    return { ok: true, data: { holdings: [], missingDividendCodes: [] } };
  }

  const stockCodes = uniqueValues(holdings.map((holding) => holding.stock_code));

  const { data: dividendData, error: dividendError } = await supabase
    .from('dividend_data')
    .select('stock_code, annual_dividend')
    .in('stock_code', stockCodes);

  if (dividendError) {
    return {
      ok: false,
      error: { type: 'unknown', message: dividendError.message },
    };
  }

  const dividendMap = new Map<string, number | null>();
  (dividendData ?? []).forEach((row) => {
    const normalized = normalizeDividendRow(row as DividendRow);
    if (normalized) {
      dividendMap.set(normalized.code, normalized.annual);
    }
  });

  const missingDividendCodes: string[] = [];
  const enrichedHoldings = holdings.map((holding) => {
    const annualDividend = dividendMap.get(holding.stock_code) ?? null;
    if (annualDividend === null) {
      missingDividendCodes.push(holding.stock_code);
    }

    return {
      ...holding,
      annual_dividend: annualDividend,
    };
  });

  return {
    ok: true,
    data: {
      holdings: enrichedHoldings,
      missingDividendCodes: uniqueValues(missingDividendCodes),
    },
  };
};
