import YahooFinance from 'yahoo-finance2';

import type {
  DividendApiError,
  DividendProvider,
  DividendProviderResult,
  DividendSnapshot,
} from '../dividends/types';

const STOCK_CODE_REGEX = /^\d{4}$/;
const yahooFinanceClient = new YahooFinance({ suppressNotices: ['ripHistorical'] });
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

const normalizeYield = (
  value: number | null,
  annualDividendRaw?: number | null,
  priceRaw?: number | null
): number | null => {
  if (value === null) {
    return null;
  }

  if (!Number.isFinite(value) || value <= 0) {
    return value;
  }

  const yieldAsPercent = value <= 1 ? value * 100 : value;
  const yieldAsPercentAlt = value <= 1 ? value : value;

  const expectedPercent =
    typeof annualDividendRaw === 'number' &&
    Number.isFinite(annualDividendRaw) &&
    annualDividendRaw > 0 &&
    typeof priceRaw === 'number' &&
    Number.isFinite(priceRaw) &&
    priceRaw > 0
      ? (annualDividendRaw / priceRaw) * 100
      : null;

  if (expectedPercent !== null && Number.isFinite(expectedPercent) && expectedPercent > 0) {
    const diffPrimary = Math.abs(yieldAsPercent - expectedPercent);
    const diffAlt = Math.abs(yieldAsPercentAlt - expectedPercent);
    const picked = diffAlt <= diffPrimary ? yieldAsPercentAlt : yieldAsPercent;
    return Number(picked.toFixed(4));
  }

  if (value <= 1 && value >= 0.2) {
    return Number(yieldAsPercentAlt.toFixed(4));
  }

  return Number(yieldAsPercent.toFixed(4));
};

const MAX_FALLBACK_YIELD_RATE = 0.15;

export const computeAnnualDividendFromYield = (
  annualDividendRaw: number | null,
  dividendYieldRaw: number | null,
  priceRaw: number | null
): number | null => {
  if (
    typeof annualDividendRaw === 'number' &&
    Number.isFinite(annualDividendRaw) &&
    annualDividendRaw > 0
  ) {
    return annualDividendRaw;
  }

  if (
    dividendYieldRaw === null ||
    !Number.isFinite(dividendYieldRaw) ||
    dividendYieldRaw <= 0
  ) {
    return annualDividendRaw;
  }

  if (
    priceRaw === null ||
    !Number.isFinite(priceRaw) ||
    priceRaw <= 0
  ) {
    return annualDividendRaw;
  }

  const normalizedYield = normalizeYield(
    dividendYieldRaw,
    annualDividendRaw,
    priceRaw
  );
  if (normalizedYield === null || !Number.isFinite(normalizedYield)) {
    return annualDividendRaw;
  }

  const yieldRate = normalizedYield / 100;
  if (!Number.isFinite(yieldRate) || yieldRate > MAX_FALLBACK_YIELD_RATE) {
    return annualDividendRaw;
  }
  const computed = priceRaw * yieldRate;

  return Number.isFinite(computed) ? Number(computed.toFixed(4)) : annualDividendRaw;
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

const buildError = (type: DividendApiError['type'], message: string): DividendApiError => ({
  type,
  message,
});

type HistoricalDividendRow = {
  date?: Date | string;
  dividends?: number;
};

const fetchPaymentMonthsFromHistory = async (
  symbol: string
): Promise<number[] | null> => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 2);

    const history = await yahooFinanceClient.historical(symbol, {
      period1: startDate,
      period2: endDate,
      events: 'dividends',
    });

    if (!Array.isArray(history) || history.length === 0) {
      return null;
    }

    const months = (history as HistoricalDividendRow[])
      .map((row) => {
        if (!row.date) return null;
        const date = row.date instanceof Date ? row.date : new Date(row.date);
        return Number.isNaN(date.getTime()) ? null : date.getUTCMonth() + 1;
      })
      .filter((month): month is number => month !== null && month >= 1 && month <= 12);

    if (months.length === 0) {
      return null;
    }

    return Array.from(new Set(months)).sort((a, b) => a - b);
  } catch {
    return null;
  }
};

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
        const priceRaw =
          toNumber(result.regularMarketPrice) ??
          toNumber(result.regularMarketPreviousClose);
        const annualDividend =
          computeAnnualDividendFromYield(annualDividendRaw, dividendYieldRaw, priceRaw);

        const paymentMonths = await fetchPaymentMonthsFromHistory(symbol);

        const snapshot: DividendSnapshot = {
          stock_code: normalizeStockCode(code),
          stock_name: pickStockName(result.shortName, result.longName),
          annual_dividend: annualDividend ?? null,
          dividend_yield: normalizeYield(
            dividendYieldRaw,
            annualDividendRaw ?? null,
            priceRaw
          ),
          ex_dividend_months: null,
          payment_months: paymentMonths,
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
