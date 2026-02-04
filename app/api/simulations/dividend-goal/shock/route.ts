import { NextResponse } from 'next/server';

import { createClient } from '../../../../../lib/supabase/server';
import { runDividendGoalSimulationMock } from '../../../../../lib/simulations/mock';
import type {
  DividendGoalAssumptions,
  DividendGoalResponse,
  DividendGoalSeriesPoint,
  DividendGoalShockRequest,
  DividendGoalShockResponse,
  SimulationErrorResponse,
} from '../../../../../lib/simulations/types';

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

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isTaxMode = (value: unknown): value is DividendGoalAssumptions['tax_mode'] =>
  value === 'after_tax' || value === 'pretax';

const getCurrentYear = () => new Date().getFullYear();

const validateRequest = (
  body: unknown
): { ok: true; value: DividendGoalShockRequest } | { ok: false; message: string } => {
  if (!body || typeof body !== 'object') {
    return { ok: false, message: 'Request body must be an object.' };
  }

  const request = body as Partial<DividendGoalShockRequest>;

  if (!isNumber(request.target_annual_dividend)) {
    return { ok: false, message: 'target_annual_dividend is required.' };
  }

  if (!isNumber(request.monthly_contribution)) {
    return { ok: false, message: 'monthly_contribution is required.' };
  }

  if (!isNumber(request.horizon_years) || request.horizon_years < 0) {
    return { ok: false, message: 'horizon_years must be 0 or greater.' };
  }

  const assumptions = request.assumptions as DividendGoalAssumptions | undefined;
  if (!assumptions) {
    return { ok: false, message: 'assumptions is required.' };
  }

  if (!isNumber(assumptions.yield_rate)) {
    return { ok: false, message: 'assumptions.yield_rate is required.' };
  }

  if (!isNumber(assumptions.dividend_growth_rate)) {
    return { ok: false, message: 'assumptions.dividend_growth_rate is required.' };
  }

  if (!isTaxMode(assumptions.tax_mode)) {
    return { ok: false, message: 'assumptions.tax_mode is invalid.' };
  }

  const shock = request.shock;
  if (!shock || typeof shock !== 'object') {
    return { ok: false, message: 'shock is required.' };
  }

  if (!isNumber(shock.year) || !Number.isInteger(shock.year)) {
    return { ok: false, message: 'shock.year must be an integer.' };
  }

  if (!isNumber(shock.rate) || shock.rate < 0 || shock.rate > 100) {
    return { ok: false, message: 'shock.rate must be between 0 and 100.' };
  }

  const currentYear = getCurrentYear();
  const maxYear = currentYear + request.horizon_years;
  if (shock.year < currentYear || shock.year > maxYear) {
    return { ok: false, message: 'shock.year must be within the horizon.' };
  }

  return { ok: true, value: request as DividendGoalShockRequest };
};

const applyShockToSeries = (
  series: DividendGoalSeriesPoint[],
  shockYear: number,
  shockRate: number
): DividendGoalSeriesPoint[] => {
  const multiplier = Math.max(0, 1 - shockRate / 100);
  return series.map((point) => {
    if (point.year < shockYear) {
      return point;
    }
    return {
      ...point,
      annual_dividend: Math.round(point.annual_dividend * multiplier),
    };
  });
};

const buildResponseFromSeries = (
  series: DividendGoalSeriesPoint[],
  input: DividendGoalShockRequest
): DividendGoalResponse => {
  const target = input.target_annual_dividend;
  const achievedPoint = series.find((point) => point.annual_dividend >= target);
  const endAnnualDividend = series.at(-1)?.annual_dividend ?? null;
  const achieved = Boolean(achievedPoint);

  return {
    snapshot: {
      current_annual_dividend: series[0]?.annual_dividend ?? 0,
      current_yield_rate: input.assumptions.yield_rate,
    },
    result: {
      achieved,
      achieved_in_year: achievedPoint?.year ?? null,
      end_annual_dividend: endAnnualDividend,
      target_annual_dividend: target,
    },
    series,
    recommendations: [],
  };
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

const isPremiumPlan = (plan: unknown): boolean => {
  return plan === 'premium' || plan === 'paid' || plan === 'pro';
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

  const plan = user.app_metadata?.plan ?? user.user_metadata?.plan ?? null;
  if (!isPremiumPlan(plan)) {
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
  const baseResult = await runDividendGoalSimulationMock(input);

  if (!baseResult.ok) {
    return NextResponse.json(
      buildErrorResponse('INTERNAL_ERROR', 'Simulation failed.'),
      { status: 500 }
    );
  }

  const base = baseResult.data;
  const baseSeries = Array.isArray(base.series) ? base.series : [];
  const shockedSeries = applyShockToSeries(
    baseSeries,
    input.shock.year,
    input.shock.rate
  );
  const shocked = buildResponseFromSeries(shockedSeries, input);
  const delta = buildDelta(base, shocked);

  return NextResponse.json({
    base,
    shocked,
    delta,
  });
}
