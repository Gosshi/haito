import { createClient } from '../supabase/client';

export type DividendLookup = {
  stockCode: string;
  annualDividend: number | null;
};

export type DividendLookupResult =
  | { ok: true; data: DividendLookup[] }
  | { ok: false; error: { message: string } };

type DividendRow = {
  stock_code?: unknown;
  annual_dividend?: unknown;
};

const normalizeCode = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

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

const uniqueValues = (values: string[]): string[] => Array.from(new Set(values));

const normalizeDividendRow = (row: DividendRow): DividendLookup | null => {
  const stockCode = normalizeCode(row.stock_code);
  if (!stockCode) {
    return null;
  }

  return {
    stockCode,
    annualDividend: toNumber(row.annual_dividend),
  };
};

export const fetchDividendLookups = async (
  codes: string[]
): Promise<DividendLookupResult> => {
  const normalizedCodes = uniqueValues(
    codes
      .map((code) => normalizeCode(code))
      .filter((code): code is string => Boolean(code))
  );

  if (normalizedCodes.length === 0) {
    return { ok: true, data: [] };
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('dividend_data')
    .select('stock_code, annual_dividend')
    .in('stock_code', normalizedCodes);

  if (error) {
    return { ok: false, error: { message: error.message } };
  }

  const dividendMap = new Map<string, DividendLookup>();
  (data ?? []).forEach((row) => {
    const normalized = normalizeDividendRow(row as DividendRow);
    if (normalized) {
      dividendMap.set(normalized.stockCode, normalized);
    }
  });

  return { ok: true, data: Array.from(dividendMap.values()) };
};
