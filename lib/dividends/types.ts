export type DividendSnapshot = {
  stock_code: string;
  stock_name: string | null;
  annual_dividend: number | null;
  dividend_yield: number | null;
  ex_dividend_months: number[] | null;
  payment_months: number[] | null;
  last_updated: string;
};

export type DividendApiErrorType =
  | 'invalid_code'
  | 'not_found'
  | 'upstream_error'
  | 'rate_limited'
  | 'unknown';

export type DividendApiError = {
  type: DividendApiErrorType;
  message: string;
};

export type DividendApiResult =
  | { ok: true; data: DividendSnapshot }
  | { ok: false; error: DividendApiError };

export type DividendBatchItemResult =
  | { code: string; ok: true; data: DividendSnapshot }
  | { code: string; ok: false; error: DividendApiError };

export type DividendBatchResult = { ok: true; results: DividendBatchItemResult[] };

export type DividendProviderResult =
  | { ok: true; data: DividendSnapshot }
  | { ok: false; error: DividendApiError };

export type DividendProvider = {
  name: string;
  fetchByCode: (code: string) => Promise<DividendProviderResult>;
};
