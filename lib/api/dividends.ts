import { createServiceClient } from '../supabase/service';

import type { DividendSnapshot } from '../dividends/types';

type DividendDataResult =
  | { ok: true }
  | { ok: false; error: { message: string } };

const sanitizeCode = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const upsertDividendData = async (
  snapshot: DividendSnapshot
): Promise<DividendDataResult> => {
  const supabase = createServiceClient();
  const payload = {
    stock_code: snapshot.stock_code,
    stock_name: snapshot.stock_name,
    annual_dividend: snapshot.annual_dividend,
    dividend_yield: snapshot.dividend_yield,
    ex_dividend_months: snapshot.ex_dividend_months,
    payment_months: snapshot.payment_months,
    last_updated: snapshot.last_updated,
  };

  const { error } = await supabase
    .from('dividend_data')
    .upsert(payload, { onConflict: 'stock_code' });

  if (error) {
    return { ok: false, error: { message: error.message } };
  }

  return { ok: true };
};

export const fetchHoldingCodesByUser = async (
  userId: string
): Promise<string[]> => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('holdings')
    .select('stock_code')
    .eq('user_id', userId);

  if (error || !data) {
    return [];
  }

  const codes = data
    .map((row) => sanitizeCode((row as { stock_code?: string | null }).stock_code ?? null))
    .filter((code): code is string => Boolean(code));

  return Array.from(new Set(codes));
};

export const fetchDistinctHoldingCodes = async (): Promise<string[]> => {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('holdings')
    .select('stock_code');

  if (error || !data) {
    return [];
  }

  const codes = data
    .map((row) => sanitizeCode((row as { stock_code?: string | null }).stock_code ?? null))
    .filter((code): code is string => Boolean(code));

  return Array.from(new Set(codes));
};
