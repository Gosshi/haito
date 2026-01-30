import YahooFinance from 'yahoo-finance2';

import type {
  DividendApiError,
  DividendProvider,
  DividendProviderResult,
  DividendSnapshot,
} from '../dividends/types';

const STOCK_CODE_REGEX = /^\d{4}$/;
const yahooFinanceClient = new YahooFinance();
const yahooFinanceQuoteOptions = {
  lang: 'ja-JP',
  region: 'JP',
} as const;

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

const JAPANESE_TEXT_REGEX = /[\u3040-\u30ff\u3400-\u9faf]/;

const hasJapaneseText = (value: string): boolean => JAPANESE_TEXT_REGEX.test(value);

const pickStockName = (
  shortName: unknown,
  longName: unknown
): string | null => {
  const short =
    typeof shortName === 'string' && shortName.trim().length > 0
      ? shortName.trim()
      : null;
  const long =
    typeof longName === 'string' && longName.trim().length > 0
      ? longName.trim()
      : null;

  if (long && hasJapaneseText(long)) {
    return long;
  }

  if (short && hasJapaneseText(short)) {
    return short;
  }

  return long ?? short;
};

const normalizeYield = (value: number | null): number | null => {
  if (value === null) {
    return null;
  }

  return value <= 1 ? Number((value * 100).toFixed(4)) : value;
};

const RATE_LIMIT_PATTERNS: RegExp[] = [
  /429/,
  /too\\s+many\\s+requests/i,
  /failed\\s+to\\s+get\\s+crumb/i,
  /rate\\s*limit/i,
];

const isRateLimitError = (message: string): boolean =>
  RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(message));

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

    const maxAttempts = 3;
    const baseDelayMs = 500;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        const result = await yahooFinanceClient.quote(
          symbol,
          yahooFinanceQuoteOptions
        );

        if (!result) {
          return {
            ok: false,
            error: buildError('not_found', 'Symbol not found.'),
          };
        }

        const annualDividendRaw =
          toNumber(result.trailingAnnualDividendRate) ??
          toNumber(result.dividendRate);
        const dividendYieldRaw =
          toNumber(result.dividendYield) ??
          toNumber(result.trailingAnnualDividendYield);
        const dividendDate =
          result.dividendDate instanceof Date ? result.dividendDate : null;

        const snapshot: DividendSnapshot = {
          stock_code: normalizeStockCode(code),
          stock_name: pickStockName(result.shortName, result.longName),
          annual_dividend: annualDividendRaw ?? null,
          dividend_yield: normalizeYield(dividendYieldRaw),
          ex_dividend_months: null,
          payment_months: dividendDate
            ? [dividendDate.getUTCMonth() + 1]
            : null,
          last_updated: new Date().toISOString(),
        };

        return { ok: true, data: snapshot };
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Upstream fetch failed.';
        const rateLimited = isRateLimitError(message);
        const notFound = /not found|no such symbol|symbol/i.test(message);

        if (rateLimited && attempt < maxAttempts - 1) {
          await sleep(baseDelayMs * 2 ** attempt);
          continue;
        }

        const type = notFound
          ? 'not_found'
          : rateLimited
            ? 'rate_limited'
            : 'upstream_error';
        return { ok: false, error: buildError(type, message) };
      }
    }

    return {
      ok: false,
      error: buildError('rate_limited', 'Upstream rate limited.'),
    };
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
