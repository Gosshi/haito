import yahooFinance from 'yahoo-finance2';

import type {
  DividendApiError,
  DividendProvider,
  DividendProviderResult,
  DividendSnapshot,
} from '../dividends/types';

const STOCK_CODE_REGEX = /^\d{4}$/;

const normalizeStockCode = (code: string): string => {
  const trimmed = code.trim().toUpperCase();
  return trimmed.endsWith('.T') ? trimmed.slice(0, -2) : trimmed;
};

const toSymbol = (code: string): string => {
  const trimmed = code.trim().toUpperCase();
  if (trimmed.endsWith('.T')) {
    return trimmed;
  }

  if (STOCK_CODE_REGEX.test(trimmed)) {
    return `${trimmed}.T`;
  }

  return trimmed;
};

const toNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const normalizeYield = (value: number | null): number | null => {
  if (value === null) {
    return null;
  }

  return value <= 1 ? Number((value * 100).toFixed(4)) : value;
};

type YahooDateValue =
  | { raw?: number | string; fmt?: string }
  | Array<{ raw?: number | string; fmt?: string }>
  | number
  | string
  | null
  | undefined;

const toDate = (value: YahooDateValue): Date | null => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    const first = value.find((item) => item != null);
    return first ? toDate(first) : null;
  }

  if (typeof value === 'number') {
    const timestamp = value > 10_000_000_000 ? value : value * 1000;
    return new Date(timestamp);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'object') {
    if (typeof value.raw === 'number' || typeof value.raw === 'string') {
      return toDate(value.raw);
    }
    if (typeof value.fmt === 'string') {
      return toDate(value.fmt);
    }
  }

  return null;
};

const extractMonths = (value: YahooDateValue): number[] | null => {
  if (!value) {
    return null;
  }

  const values = Array.isArray(value) ? value : [value];
  const months = values
    .map((item) => toDate(item))
    .filter((date): date is Date => Boolean(date))
    .map((date) => date.getUTCMonth() + 1)
    .filter((month) => month >= 1 && month <= 12);

  if (months.length === 0) {
    return null;
  }

  return Array.from(new Set(months)).sort((a, b) => a - b);
};

const buildError = (type: DividendApiError['type'], message: string): DividendApiError => ({
  type,
  message,
});

export class YahooFinanceProvider implements DividendProvider {
  name = 'yahoo-finance2';

  async fetchByCode(code: string): Promise<DividendProviderResult> {
    const symbol = toSymbol(code);

    try {
      const result = await yahooFinance.quoteSummary(symbol, {
        modules: ['summaryDetail', 'calendarEvents', 'price'],
      });

      if (!result) {
        return {
          ok: false,
          error: buildError('not_found', 'Symbol not found.'),
        };
      }

      const summaryDetail = result.summaryDetail ?? null;
      const calendarEvents = result.calendarEvents ?? null;
      const price = result.price ?? null;

      const annualDividendRaw =
        toNumber(summaryDetail?.trailingAnnualDividendRate) ??
        toNumber(summaryDetail?.dividendRate);
      const dividendYieldRaw =
        toNumber(summaryDetail?.dividendYield) ??
        toNumber(summaryDetail?.trailingAnnualDividendYield);

      const snapshot: DividendSnapshot = {
        stock_code: normalizeStockCode(code),
        stock_name:
          (typeof price?.shortName === 'string' && price.shortName) ||
          (typeof price?.longName === 'string' && price.longName) ||
          null,
        annual_dividend: annualDividendRaw ?? null,
        dividend_yield: normalizeYield(dividendYieldRaw),
        ex_dividend_months: extractMonths(calendarEvents?.exDividendDate ?? null),
        payment_months: extractMonths(calendarEvents?.dividendDate ?? null),
        last_updated: new Date().toISOString(),
      };

      return { ok: true, data: snapshot };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Upstream fetch failed.';
      const type = /not found|no such symbol|symbol/i.test(message)
        ? 'not_found'
        : 'upstream_error';
      return { ok: false, error: buildError(type, message) };
    }
  }
}

const defaultProviders: DividendProvider[] = [new YahooFinanceProvider()];

export const fetchDividendWithFallback = async (
  code: string,
  providers: DividendProvider[] = defaultProviders
): Promise<DividendProviderResult> => {
  let lastError: DividendApiError | null = null;

  for (const provider of providers) {
    const result = await provider.fetchByCode(code);
    if (result.ok) {
      return result;
    }

    lastError = result.error;
  }

  return {
    ok: false,
    error:
      lastError ?? buildError('upstream_error', 'Dividend fetch failed.'),
  };
};
