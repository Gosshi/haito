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
    return NextResponse.json(
      buildErrorResponse('unknown', 'Failed to fetch history list'),
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
    return NextResponse.json(
      buildErrorResponse('unknown', 'Failed to save history'),
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, data: created });
}
