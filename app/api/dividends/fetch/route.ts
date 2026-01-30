import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

import { fetchHoldingCodesByUser, fetchDistinctHoldingCodes, upsertDividendData } from '../../../../lib/api/dividends';
import type {
  DividendApiError,
  DividendApiResult,
  DividendBatchItemResult,
  DividendBatchResult,
} from '../../../../lib/dividends/types';
import { fetchDividendWithFallback } from '../../../../lib/external/yahoo-finance';
import { createClient } from '../../../../lib/supabase/server';

const STOCK_CODE_REGEX = /^\d{4}$/;
const CRON_SECRET = process.env.CRON_SECRET ?? '';

const buildError = (type: DividendApiError['type'], message: string): DividendApiError => ({
  type,
  message,
});

const normalizeErrorMessage = (error: DividendApiError): DividendApiError => {
  if (error.type === 'rate_limited') {
    return {
      type: error.type,
      message: '取得が混雑しています。しばらく待って再試行してください。',
    };
  }

  return error;
};

const isAuthorizedCron = (request: Request): boolean => {
  if (!CRON_SECRET) {
    return false;
  }

  const authorization = request.headers.get('authorization');
  return authorization === `Bearer ${CRON_SECRET}`;
};

const requireUserId = async (): Promise<string | null> => {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  const user = error ? null : data.user;
  return user?.id ?? null;
};

const validateStockCode = (code: string): string | null => {
  const trimmed = code.trim();
  if (!STOCK_CODE_REGEX.test(trimmed)) {
    return null;
  }
  return trimmed;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const runBatch = async (codes: string[]): Promise<DividendBatchResult> => {
  const uniqueCodes = Array.from(new Set(codes)).filter(Boolean);
  const results: DividendBatchItemResult[] = [];
  const chunkSize = 5;

  for (let i = 0; i < uniqueCodes.length; i += chunkSize) {
    const chunk = uniqueCodes.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map(async (code): Promise<DividendBatchItemResult> => {
        const normalized = validateStockCode(code);
        if (!normalized) {
          return {
            code,
            ok: false,
            error: buildError('invalid_code', 'Invalid stock code.'),
          };
        }

        const fetchResult = await fetchDividendWithFallback(normalized);
        if (!fetchResult.ok) {
          return {
            code: normalized,
            ok: false,
            error: normalizeErrorMessage(fetchResult.error),
          };
        }

        const upsertResult = await upsertDividendData(fetchResult.data);
        if (!upsertResult.ok) {
          return {
            code: normalized,
            ok: false,
            error: buildError('unknown', upsertResult.error.message),
          };
        }

        return { code: normalized, ok: true, data: fetchResult.data };
      })
    );

    results.push(...chunkResults);

    if (i + chunkSize < uniqueCodes.length) {
      await sleep(200);
    }
  }

  return { ok: true, results };
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    if (!isAuthorizedCron(request)) {
      return NextResponse.json(
        { ok: false, error: buildError('unknown', 'Unauthorized.') },
        { status: 401 }
      );
    }

    const codes = await fetchDistinctHoldingCodes();
    const batchResult = await runBatch(codes);
    return NextResponse.json(batchResult);
  }

  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: buildError('unknown', 'Authentication required.') },
      { status: 401 }
    );
  }

  const normalized = validateStockCode(code);
  if (!normalized) {
    return NextResponse.json(
      { ok: false, error: buildError('invalid_code', 'Invalid stock code.') },
      { status: 400 }
    );
  }

  const fetchResult = await fetchDividendWithFallback(normalized);
  if (!fetchResult.ok) {
    const response: DividendApiResult = {
      ok: false,
      error: normalizeErrorMessage(fetchResult.error),
    };
    const status = fetchResult.error.type === 'rate_limited' ? 429 : 502;
    return NextResponse.json(response, { status });
  }

  const upsertResult = await upsertDividendData(fetchResult.data);
  if (!upsertResult.ok) {
    const response: DividendApiResult = {
      ok: false,
      error: buildError('unknown', upsertResult.error.message),
    };
    return NextResponse.json(response, { status: 500 });
  }

  const response: DividendApiResult = { ok: true, data: fetchResult.data };
  return NextResponse.json(response);
}

export async function POST(request: Request) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: buildError('unknown', 'Authentication required.') },
      { status: 401 }
    );
  }

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const rawCodes =
    body && typeof body === 'object' && Array.isArray((body as { codes?: unknown }).codes)
      ? ((body as { codes: string[] }).codes)
      : null;

  const codes = rawCodes ?? (await fetchHoldingCodesByUser(userId));
  const result = await runBatch(codes);

  return NextResponse.json(result);
}
