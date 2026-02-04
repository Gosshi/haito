import { NextResponse } from 'next/server';

import { createClient } from '../../../../../lib/supabase/server';
import type {
  RoadmapHistoryDetail,
  RoadmapHistoryErrorType,
  RoadmapHistoryResult,
} from '../../../../../lib/roadmap-history/types';

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

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isValidUuid = (value: string): boolean => uuidPattern.test(value);

export async function GET(
  _request: Request,
  context: { params: { id: string } }
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

  const { id } = context.params;
  if (!isValidUuid(id)) {
    return NextResponse.json(
      buildErrorResponse('validation', 'Invalid history id'),
      { status: 400 }
    );
  }

  const { data: history, error } = await supabase
    .from('roadmap_histories')
    .select('id, created_at, input, summary, series')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return NextResponse.json(
        buildErrorResponse('not_found', 'History not found'),
        { status: 404 }
      );
    }

    return NextResponse.json(
      buildErrorResponse('unknown', 'Failed to fetch history'),
      { status: 500 }
    );
  }

  if (!history) {
    return NextResponse.json(
      buildErrorResponse('not_found', 'History not found'),
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: history });
}
