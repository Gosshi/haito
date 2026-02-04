import { NextResponse } from 'next/server';

import { createClient } from '../../../../lib/supabase/server';
import type {
  RoadmapHistoryCreateRequest,
  RoadmapHistoryDetail,
  RoadmapHistoryErrorType,
  RoadmapHistoryListItem,
  RoadmapHistoryResult,
  RoadmapHistorySummary,
} from '../../../../lib/roadmap-history/types';

type ErrorResult = {
  ok: false;
  error: { type: RoadmapHistoryErrorType; message: string };
};

const buildErrorResponse = (
  type: RoadmapHistoryErrorType,
  message: string
): ErrorResult => ({
  ok: false,
  error: { type, message },
});

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

const isSupabaseError = (value: unknown): value is SupabaseErrorLike => {
  if (!isRecord(value)) {
    return false;
  }
  return (
    'message' in value ||
    'code' in value ||
    'details' in value ||
    'hint' in value
  );
};

const validationErrorCodes = new Set([
  '22P02', // invalid_text_representation
  '22001', // string_data_right_truncation
  '23502', // not_null_violation
  '23503', // foreign_key_violation
  '23505', // unique_violation
]);

const resolveSupabaseErrorType = (
  error: SupabaseErrorLike | null
): RoadmapHistoryErrorType => {
  if (!error) {
    return 'unknown';
  }

  if (error.code && validationErrorCodes.has(error.code)) {
    return 'validation';
  }

  if (
    error.code === '42501' ||
    (typeof error.message === 'string' &&
      error.message.toLowerCase().includes('row-level security'))
  ) {
    return 'unauthorized';
  }

  return 'unknown';
};

const buildSupabaseErrorMessage = (
  fallback: string,
  error: SupabaseErrorLike | null
): string => {
  if (!error || process.env.NODE_ENV === 'production') {
    return fallback;
  }

  const parts = [fallback];
  if (error.code) {
    parts.push(`(${error.code})`);
  }
  if (error.message) {
    parts.push(error.message);
  }
  if (error.hint) {
    parts.push(error.hint);
  }

  return parts.join(' ');
};

const logSupabaseError = (context: string, error: SupabaseErrorLike | null) => {
  if (!error) {
    return;
  }

  console.error(context, {
    code: error.code ?? null,
    message: error.message ?? null,
    details: error.details ?? null,
    hint: error.hint ?? null,
  });
};

const parseLimit = (
  value: string | null
): { ok: true; value: number } | { ok: false; message: string } => {
  if (!value) {
    return { ok: true, value: DEFAULT_LIMIT };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed <= 0) {
    return { ok: false, message: 'limit must be a positive integer' };
  }

  return { ok: true, value: Math.min(parsed, MAX_LIMIT) };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object';

const hasSummaryShape = (value: unknown): value is RoadmapHistorySummary => {
  if (!isRecord(value)) {
    return false;
  }
  return 'snapshot' in value && 'result' in value;
};

const validateCreateRequest = (
  body: unknown
):
  | { ok: true; value: RoadmapHistoryCreateRequest }
  | { ok: false; message: string } => {
  if (!isRecord(body)) {
    return { ok: false, message: 'Request body must be an object' };
  }

  const payload = body as Partial<RoadmapHistoryCreateRequest>;

  if (!isRecord(payload.input)) {
    return { ok: false, message: 'input is required' };
  }

  if (!hasSummaryShape(payload.summary)) {
    return { ok: false, message: 'summary is required' };
  }

  if (!Array.isArray(payload.series)) {
    return { ok: false, message: 'series is required' };
  }

  return { ok: true, value: payload as RoadmapHistoryCreateRequest };
};

export async function GET(
  request: Request
): Promise<NextResponse<RoadmapHistoryResult<RoadmapHistoryListItem[]>>> {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : data.user;

  if (!user) {
    return NextResponse.json(
      buildErrorResponse('unauthorized', 'Authentication required'),
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limitResult = parseLimit(searchParams.get('limit'));
  if (!limitResult.ok) {
    return NextResponse.json(
      buildErrorResponse('validation', limitResult.message),
      { status: 400 }
    );
  }

  const { data: items, error } = await supabase
    .from('roadmap_histories')
    .select('id, created_at, input, summary')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limitResult.value);

  if (error) {
    logSupabaseError('Failed to fetch roadmap history list', error);
    return NextResponse.json(
      buildErrorResponse(
        'unknown',
        buildSupabaseErrorMessage('Failed to fetch history list', error)
      ),
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: items ?? [] });
}

export async function POST(
  request: Request
): Promise<NextResponse<RoadmapHistoryResult<RoadmapHistoryDetail>>> {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : data.user;

  if (!user) {
    return NextResponse.json(
      buildErrorResponse('unauthorized', 'Authentication required'),
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      buildErrorResponse('validation', 'Invalid JSON body'),
      { status: 400 }
    );
  }

  const validation = validateCreateRequest(body);
  if (!validation.ok) {
    return NextResponse.json(
      buildErrorResponse('validation', validation.message),
      { status: 400 }
    );
  }

  const payload = validation.value;
  const { data: created, error } = await supabase
    .from('roadmap_histories')
    .insert({
      user_id: user.id,
      input: payload.input,
      summary: payload.summary,
      series: payload.series,
    })
    .select('id, created_at, input, summary, series')
    .single();

  if (error || !created) {
    const errorLike = isSupabaseError(error) ? error : null;
    const errorType = resolveSupabaseErrorType(errorLike);
    const status =
      errorType === 'validation'
        ? 400
        : errorType === 'unauthorized'
          ? 401
          : 500;

    logSupabaseError('Failed to save roadmap history', errorLike);
    return NextResponse.json(
      buildErrorResponse(
        errorType,
        buildSupabaseErrorMessage('Failed to save history', errorLike)
      ),
      { status }
    );
  }

  return NextResponse.json({ ok: true, data: created });
}
