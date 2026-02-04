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
import { dividendGoalShockRequestSchema } from '../../../../../lib/simulations/types';

const buildErrorResponse = (
  code: string,
  message: string
): SimulationErrorResponse => ({
  error: {
    code,
    message,
    details: null,
  },
});

const getCurrentYear = () => new Date().getFullYear();

const validateRequest = (
  body: unknown
): { ok: true; value: DividendGoalShockRequest } | { ok: false; message: string } => {
  const parsed = dividendGoalShockRequestSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, message: 'Invalid request body.' };
  }

  const request = parsed.data;
  const currentYear = getCurrentYear();
  const maxYear = currentYear + request.horizon_years;
  if (request.shock.year < currentYear || request.shock.year > maxYear) {
    return { ok: false, message: 'shock.year must be within the horizon.' };
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
      buildErrorResponse('BAD_REQUEST', 'Invalid JSON body.'),
      { status: 400 }
    );
  }

  const validation = validateRequest(body);
  if (!validation.ok) {
    return NextResponse.json(
      buildErrorResponse('BAD_REQUEST', validation.message),
      { status: 400 }
    );
  }

  const input = validation.value;
  const baseResult = await runDividendGoalSimulation(input);

  if (!baseResult.ok) {
    return NextResponse.json(
      buildErrorResponse('INTERNAL_ERROR', 'Simulation failed.'),
      { status: 500 }
    );
  }

  const shockedResult = await runDividendGoalSimulation(input, {
    shock: input.shock,
  });

  if (!shockedResult.ok) {
    return NextResponse.json(
      buildErrorResponse('INTERNAL_ERROR', 'Simulation failed.'),
      { status: 500 }
    );
  }

  const base = baseResult.data;
  const { recommendations: _recommendations, ...shocked } = shockedResult.data;
  const delta = buildDelta(base, shocked);

  return NextResponse.json({
    base,
    shocked,
    delta,
  });
}
