import { NextResponse } from 'next/server';

import { createAccessGateService } from '../../../../../lib/access/access-gate';
import { createClient } from '../../../../../lib/supabase/server';
import { runDividendGoalSimulation } from '../../../../../lib/simulations/dividend-goal-sim';
import type {
  DividendGoalResponse,
  DividendGoalShockRequest,
  DividendGoalShockResponse,
  SimulationErrorResponse,
} from '../../../../../lib/simulations/types';
import {
  dividendGoalShockRequestSchema,
  dividendGoalShockResponseSchema,
} from '../../../../../lib/simulations/types';

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

const INVALID_INPUT_MESSAGE = '試算の前提条件が不正です。';

const getCurrentYear = () => new Date().getFullYear();

const toStatusCode = (code: string): number => {
  if (code === 'UNAUTHORIZED') {
    return 401;
  }
  if (code === 'FORBIDDEN') {
    return 403;
  }
  if (code === 'BAD_REQUEST') {
    return 400;
  }
  if (code === 'INTERNAL_ERROR') {
    return 500;
  }
  return 500;
};

const validateRequest = (
  body: unknown
):
  | { ok: true; value: DividendGoalShockRequest }
  | { ok: false; details: { issues: unknown[] } } => {
  const parsed = dividendGoalShockRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, details: { issues: parsed.error.issues } };
  }

  const request = parsed.data;
  const currentYear = getCurrentYear();
  const maxYear = currentYear + request.horizon_years;
  if (request.shock.year < currentYear || request.shock.year > maxYear) {
    return {
      ok: false,
      details: {
        issues: [
          {
            code: 'custom',
            path: ['shock', 'year'],
            message: '前提条件として shock.year は期間内である必要があります。',
          },
        ],
      },
    };
  }

  return { ok: true, value: request };
};

const buildDelta = (
  base: DividendGoalResponse,
  shocked: DividendGoalResponse
): DividendGoalShockResponse['delta'] => {
  const baseAchieved = base.result?.achieved_in_year ?? null;
  const shockedAchieved = shocked.result?.achieved_in_year ?? null;
  const baseEnd = base.result?.end_annual_dividend;
  const shockedEnd = shocked.result?.end_annual_dividend;

  const achievedYearDelay =
    baseAchieved !== null && shockedAchieved !== null
      ? shockedAchieved - baseAchieved
      : null;

  const endAnnualDividendGap =
    typeof baseEnd === 'number' && typeof shockedEnd === 'number'
      ? baseEnd - shockedEnd
      : null;

  return {
    achieved_year_delay: achievedYearDelay,
    end_annual_dividend_gap: endAnnualDividendGap,
  };
};

export async function POST(
  request: Request
): Promise<NextResponse<DividendGoalShockResponse | SimulationErrorResponse>> {
  try {
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.getUser();
    const user = authError ? null : data.user;

    if (!user) {
      return NextResponse.json(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required.'),
        { status: 401 }
      );
    }

    const accessGate = createAccessGateService();
    const decision = await accessGate.decideAccess({ feature: 'stress_test' });
    if (!decision.allowed) {
      return NextResponse.json(
        buildErrorResponse('FORBIDDEN', 'Access forbidden.'),
        { status: 403 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        buildErrorResponse('BAD_REQUEST', INVALID_INPUT_MESSAGE),
        { status: 400 }
      );
    }

    const validation = validateRequest(body);
    if (!validation.ok) {
      return NextResponse.json(
        buildErrorResponse(
          'BAD_REQUEST',
          INVALID_INPUT_MESSAGE,
          validation.details
        ),
        { status: 400 }
      );
    }

    const input = validation.value;
    const baseResult = await runDividendGoalSimulation(input);

    if (!baseResult.ok) {
      const status = toStatusCode(baseResult.error.error.code);
      return NextResponse.json(baseResult.error, { status });
    }

    const shockedResult = await runDividendGoalSimulation(input, {
      shock: input.shock,
    });

    if (!shockedResult.ok) {
      const status = toStatusCode(shockedResult.error.error.code);
      return NextResponse.json(shockedResult.error, { status });
    }

    const base = baseResult.data;
    const { recommendations: _recommendations, ...shocked } =
      shockedResult.data;
    const delta = buildDelta(base, shocked);

    const responsePayload = {
      base,
      shocked,
      delta,
    };
    const responseValidation =
      dividendGoalShockResponseSchema.safeParse(responsePayload);
    if (!responseValidation.success) {
      return NextResponse.json(
        buildErrorResponse('INTERNAL_ERROR', 'Invalid simulation response.'),
        { status: 500 }
      );
    }

    return NextResponse.json(responseValidation.data);
  } catch {
    return NextResponse.json(
      buildErrorResponse(
        'INTERNAL_ERROR',
        '試算中に予期しないエラーが発生しました。'
      ),
      { status: 500 }
    );
  }
}
