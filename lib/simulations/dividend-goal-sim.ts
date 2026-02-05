import { calculateDividendSummary } from '../calculations/dividend';
import { fetchDashboardData } from '../api/dashboard';
import {
  dividendGoalRequestSchema,
  dividendGoalResponseSchema,
  dividendGoalShockSchema,
} from './types';
import type {
  AccountType,
  DividendGoalRecommendation,
  DividendGoalRequest,
  DividendGoalResponse,
  DividendGoalResult,
  DividendGoalSeriesPoint,
  DividendGoalSnapshot,
  DividendGoalShock,
  SimulationErrorResponse,
  SimulationResult,
  TaxMode,
} from './types';

type SnapshotContext = {
  currentAnnualDividend: number;
  currentYieldRate: number | null;
  totalInvestment: number;
  totalPreTax: number;
};

type SimulationOptions = {
  shock?: DividendGoalShock;
};

const INVALID_INPUT_MESSAGE = '試算の前提条件が不正です。';

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

const roundCurrency = (value: number): number => Math.round(value);

const normalizeNumber = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

const resolveTaxRate = (accountType: AccountType): number =>
  accountType === 'taxable' ? 0.20315 : 0;

const calculateYieldRate = (
  taxMode: TaxMode,
  totalPreTax: number,
  totalAfterTax: number,
  totalInvestment: number
): number | null => {
  if (!Number.isFinite(totalInvestment) || totalInvestment <= 0) {
    return null;
  }

  const base =
    taxMode === 'after_tax' ? totalAfterTax : totalPreTax;
  if (!Number.isFinite(base)) {
    return null;
  }

  return (base / totalInvestment) * 100;
};

const buildSnapshotContext = async (
  taxMode: TaxMode
): Promise<SimulationResult<SnapshotContext>> => {
  const dashboardResult = await fetchDashboardData();
  if (!dashboardResult.ok) {
    const code =
      dashboardResult.error.type === 'unauthorized'
        ? 'UNAUTHORIZED'
        : 'INTERNAL_ERROR';
    return {
      ok: false,
      error: buildErrorResponse(code, dashboardResult.error.message),
    };
  }

  const summary = calculateDividendSummary(dashboardResult.data.holdings);
  const totalPreTax = normalizeNumber(summary.totalPreTax);
  const totalAfterTax = normalizeNumber(summary.totalAfterTax);
  const totalInvestment = normalizeNumber(summary.totalInvestment);
  const currentAnnualDividend =
    taxMode === 'after_tax' ? totalAfterTax : totalPreTax;
  const currentYieldRate = calculateYieldRate(
    taxMode,
    totalPreTax,
    totalAfterTax,
    totalInvestment
  );

  return {
    ok: true,
    data: {
      currentAnnualDividend: roundCurrency(currentAnnualDividend),
      currentYieldRate:
        typeof currentYieldRate === 'number'
          ? Math.round(currentYieldRate * 100) / 100
          : null,
      totalInvestment: Math.max(0, totalInvestment),
      totalPreTax: Math.max(0, totalPreTax),
    },
  };
};

const validateSimulationInput = (
  input: DividendGoalRequest,
  options?: SimulationOptions
):
  | { ok: true; value: DividendGoalRequest }
  | { ok: false; details: { issues: unknown[] } } => {
  const parsed = dividendGoalRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, details: { issues: parsed.error.issues } };
  }

  if (options?.shock) {
    const shockParsed = dividendGoalShockSchema.safeParse(options.shock);
    if (!shockParsed.success) {
      return { ok: false, details: { issues: shockParsed.error.issues } };
    }
  }

  return { ok: true, value: parsed.data };
};

const validateSimulationOutput = (
  data: DividendGoalResponse
): { ok: true; value: DividendGoalResponse } | { ok: false; details: { issues: unknown[] } } => {
  const parsed = dividendGoalResponseSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, details: { issues: parsed.error.issues } };
  }
  return { ok: true, value: parsed.data };
};

const buildSeries = (
  input: DividendGoalRequest,
  context: SnapshotContext,
  options?: SimulationOptions
): DividendGoalSeriesPoint[] => {
  const startYear = new Date().getFullYear();
  const years = Math.max(0, Math.floor(input.horizon_years));
  const growthRate = input.assumptions.dividend_growth_rate / 100;
  const baseYieldRate = input.assumptions.yield_rate / 100;
  const annualContribution = input.monthly_contribution * 12;
  const reinvestRate = input.assumptions.reinvest_rate;
  const taxRate = resolveTaxRate(input.assumptions.account_type);
  const shock = options?.shock;
  const shockMultiplier =
    shock !== undefined ? Math.max(0, 1 - shock.rate / 100) : 1;

  const series: DividendGoalSeriesPoint[] = [];
  const initialCapital =
    context.totalInvestment > 0
      ? context.totalInvestment
      : baseYieldRate > 0
        ? context.totalPreTax / baseYieldRate
        : 0;
  let capital = Math.max(0, initialCapital);

  const resolveEffectiveYield = (index: number): number => {
    if (!Number.isFinite(baseYieldRate) || baseYieldRate <= 0) {
      return 0;
    }
    const growthFactor = Number.isFinite(growthRate)
      ? Math.pow(1 + growthRate, index)
      : 1;
    const base = baseYieldRate * growthFactor;
    if (!Number.isFinite(base)) {
      return 0;
    }
    const year = startYear + index;
    const adjusted =
      shock && year >= shock.year ? base * shockMultiplier : base;
    return Math.max(0, adjusted);
  };

  let annualDividend = Math.max(0, capital * resolveEffectiveYield(0));

  for (let index = 0; index <= years; index += 1) {
    series.push({
      year: startYear + index,
      annual_dividend: roundCurrency(annualDividend),
    });

    if (index === years) {
      break;
    }

    const reinvested = annualDividend * reinvestRate * (1 - taxRate);
    capital = Math.max(0, capital + annualContribution + reinvested);
    annualDividend = Math.max(0, capital * resolveEffectiveYield(index + 1));
  }

  return series;
};

const buildResult = (
  series: DividendGoalSeriesPoint[],
  targetAnnualDividend: number,
  currentAnnualDividend: number
): DividendGoalResult => {
  const target = roundCurrency(Math.max(0, targetAnnualDividend));
  const achievedPoint = series.find(
    (point) => point.annual_dividend >= target
  );
  const endAnnualDividend = series.at(-1)?.annual_dividend ?? null;
  const gapNow = roundCurrency(
    Math.max(0, target - Math.max(0, currentAnnualDividend))
  );

  return {
    achieved: Boolean(achievedPoint),
    achieved_in_year: achievedPoint?.year ?? null,
    gap_now: gapNow,
    end_annual_dividend: endAnnualDividend,
    target_annual_dividend: target,
  };
};

const buildSnapshot = (
  context: SnapshotContext
): DividendGoalSnapshot => ({
  current_annual_dividend: context.currentAnnualDividend,
  current_yield_rate: context.currentYieldRate,
});

const simulateFromSnapshot = (
  input: DividendGoalRequest,
  context: SnapshotContext,
  options?: SimulationOptions
): { series: DividendGoalSeriesPoint[]; result: DividendGoalResult } => {
  const series = buildSeries(input, context, options);
  const result = buildResult(
    series,
    input.target_annual_dividend,
    context.currentAnnualDividend
  );

  return { series, result };
};

const buildRecommendationPayload = (
  title: string,
  message: string,
  type: string,
  delta: Record<string, number>,
  result: DividendGoalResult
): DividendGoalRecommendation => ({
  type,
  title,
  label: title,
  message,
  delta,
  result: {
    achieved: result.achieved ?? false,
    achieved_in_year: result.achieved_in_year ?? null,
    end_annual_dividend: result.end_annual_dividend ?? null,
    gap_now: result.gap_now ?? null,
    target_annual_dividend: result.target_annual_dividend ?? null,
  },
});

const buildRecommendations = (
  input: DividendGoalRequest,
  context: SnapshotContext,
  options?: SimulationOptions
): DividendGoalRecommendation[] => {
  const monthlyBoost = 10000;
  const yieldBoost = 0.5;

  const monthlyInput: DividendGoalRequest = {
    ...input,
    monthly_contribution: input.monthly_contribution + monthlyBoost,
  };
  const monthlyResult = simulateFromSnapshot(
    monthlyInput,
    context,
    options
  ).result;

  const yieldInput: DividendGoalRequest = {
    ...input,
    assumptions: {
      ...input.assumptions,
      yield_rate: input.assumptions.yield_rate + yieldBoost,
    },
  };
  const yieldResult = simulateFromSnapshot(
    yieldInput,
    context,
    options
  ).result;

  return [
    buildRecommendationPayload(
      '月次+10,000円の影響',
      '月次追加投資額を10,000円増やした場合の試算結果です。',
      'monthly_contribution',
      { monthly_contribution: monthlyBoost },
      monthlyResult
    ),
    buildRecommendationPayload(
      '利回り+0.5%の影響',
      '想定利回りを0.5%上げた場合の試算結果です。',
      'yield_rate',
      { yield_rate: yieldBoost },
      yieldResult
    ),
  ];
};

export const runDividendGoalSimulation = async (
  input: DividendGoalRequest,
  options?: SimulationOptions
): Promise<SimulationResult<DividendGoalResponse>> => {
  const inputValidation = validateSimulationInput(input, options);
  if (!inputValidation.ok) {
    return {
      ok: false,
      error: buildErrorResponse(
        'BAD_REQUEST',
        INVALID_INPUT_MESSAGE,
        inputValidation.details
      ),
    };
  }

  const validatedInput = inputValidation.value;
  const snapshotContext = await buildSnapshotContext(
    validatedInput.assumptions.tax_mode
  );
  if (!snapshotContext.ok) {
    return snapshotContext;
  }

  const context = snapshotContext.data;
  const { series, result } = simulateFromSnapshot(
    validatedInput,
    context,
    options
  );
  const recommendations = buildRecommendations(validatedInput, context, options);

  const response = {
    snapshot: buildSnapshot(context),
    result,
    series,
    recommendations,
  };
  const outputValidation = validateSimulationOutput(response);
  if (!outputValidation.ok) {
    return {
      ok: false,
      error: buildErrorResponse(
        'BAD_REQUEST',
        INVALID_INPUT_MESSAGE,
        outputValidation.details
      ),
    };
  }

  return {
    ok: true,
    data: outputValidation.value,
  };
};
