import { calculateDividendSummary } from '../calculations/dividend';
import { fetchDashboardData } from '../api/dashboard';
import type {
  DividendGoalRecommendation,
  DividendGoalRequest,
  DividendGoalResponse,
  DividendGoalResult,
  DividendGoalSeriesPoint,
  DividendGoalSnapshot,
  SimulationErrorResponse,
  SimulationResult,
  TaxMode,
} from './types';

type SnapshotContext = {
  currentAnnualDividend: number;
  currentYieldRate: number | null;
};

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
    },
  };
};

const buildSeries = (
  input: DividendGoalRequest,
  currentAnnualDividend: number
): DividendGoalSeriesPoint[] => {
  const startYear = new Date().getFullYear();
  const years = Math.max(0, Math.floor(input.horizon_years));
  const growthRate = input.assumptions.dividend_growth_rate / 100;
  const yieldRate = input.assumptions.yield_rate / 100;
  const annualContribution = input.monthly_contribution * 12;

  const series: DividendGoalSeriesPoint[] = [];
  let annualDividend = Math.max(0, currentAnnualDividend);

  for (let index = 0; index <= years; index += 1) {
    if (index > 0) {
      const growth = annualDividend * growthRate;
      const contributionImpact = annualContribution * yieldRate;
      annualDividend = Math.max(0, annualDividend + growth + contributionImpact);
    }

    series.push({
      year: startYear + index,
      annual_dividend: roundCurrency(annualDividend),
    });
  }

  return series;
};

const buildResult = (
  series: DividendGoalSeriesPoint[],
  targetAnnualDividend: number,
  currentAnnualDividend: number
): DividendGoalResult => {
  const target = Math.max(0, targetAnnualDividend);
  const achievedPoint = series.find(
    (point) => point.annual_dividend >= target
  );
  const endAnnualDividend = series.at(-1)?.annual_dividend ?? null;
  const gapNow = Math.max(0, target - Math.max(0, currentAnnualDividend));

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
  context: SnapshotContext
): { series: DividendGoalSeriesPoint[]; result: DividendGoalResult } => {
  const series = buildSeries(input, context.currentAnnualDividend);
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
  context: SnapshotContext
): DividendGoalRecommendation[] => {
  const monthlyBoost = 10000;
  const yieldBoost = 0.5;

  const monthlyInput: DividendGoalRequest = {
    ...input,
    monthly_contribution: input.monthly_contribution + monthlyBoost,
  };
  const monthlyResult = simulateFromSnapshot(monthlyInput, context).result;

  const yieldInput: DividendGoalRequest = {
    ...input,
    assumptions: {
      ...input.assumptions,
      yield_rate: input.assumptions.yield_rate + yieldBoost,
    },
  };
  const yieldResult = simulateFromSnapshot(yieldInput, context).result;

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
  input: DividendGoalRequest
): Promise<SimulationResult<DividendGoalResponse>> => {
  const snapshotContext = await buildSnapshotContext(input.assumptions.tax_mode);
  if (!snapshotContext.ok) {
    return snapshotContext;
  }

  const context = snapshotContext.data;
  const { series, result } = simulateFromSnapshot(input, context);
  const recommendations = buildRecommendations(input, context);

  return {
    ok: true,
    data: {
      snapshot: buildSnapshot(context),
      result,
      series,
      recommendations,
    },
  };
};
