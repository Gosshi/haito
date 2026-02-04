import { NextResponse } from 'next/server';

import { createClient } from '../../../../lib/supabase/server';
import { runDividendGoalSimulation } from '../../../../lib/simulations/dividend-goal-sim';
import {
  dividendGoalRequestSchema,
  dividendGoalResponseSchema,
} from '../../../../lib/simulations/types';
import type {
  DividendGoalResponse,
  SimulationErrorResponse,
} from '../../../../lib/simulations/types';

const buildErrorResponse = (
  code: string,
  message: string,
  details: unknown | null = null
): SimulationErrorResponse => ({
  error: {
    code,
    message,
    details,
  },
});

const toStatusCode = (code: string): number => {
  if (code === 'UNAUTHORIZED') {
    return 401;
  }
  if (code === 'BAD_REQUEST') {
    return 400;
  }
  if (code === 'INTERNAL_ERROR') {
    return 500;
  }
  return 500;
};

export async function POST(
  request: Request
): Promise<NextResponse<DividendGoalResponse | SimulationErrorResponse>> {
  const supabase = createClient();
  const { data, error: authError } = await supabase.auth.getUser();
  const user = authError ? null : data.user;

  if (!user) {
    return NextResponse.json(
      buildErrorResponse('UNAUTHORIZED', 'Authentication required.'),
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      buildErrorResponse('BAD_REQUEST', 'Invalid JSON body.'),
      { status: 400 }
    );
  }

  const parsed = dividendGoalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      buildErrorResponse('BAD_REQUEST', 'Invalid request body.', {
        issues: parsed.error.issues,
      }),
      { status: 400 }
    );
  }

  const result = await runDividendGoalSimulation(parsed.data);
  if (!result.ok) {
    const status = toStatusCode(result.error.error.code);
    return NextResponse.json(result.error, { status });
  }

  const responseValidation = dividendGoalResponseSchema.safeParse(result.data);
  if (!responseValidation.success) {
    return NextResponse.json(
      buildErrorResponse('INTERNAL_ERROR', 'Invalid simulation response.'),
      { status: 500 }
    );
  }

  return NextResponse.json(responseValidation.data);
}
