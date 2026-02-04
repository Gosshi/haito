export {
  accountTypeSchema,
  dividendGoalAssumptionsSchema,
  dividendGoalRecommendationSchema,
  dividendGoalRequestSchema,
  dividendGoalResponseSchema,
  dividendGoalResultSchema,
  dividendGoalSeriesPointSchema,
  dividendGoalShockRequestSchema,
  dividendGoalShockSchema,
  dividendGoalSnapshotSchema,
  simulationErrorSchema,
  taxModeSchema,
} from './dividend-goal-schema';

export type {
  AccountType,
  DividendGoalAssumptions,
  DividendGoalRecommendation,
  DividendGoalRequest,
  DividendGoalResponse,
  DividendGoalResult,
  DividendGoalSeriesPoint,
  DividendGoalShock,
  DividendGoalShockRequest,
  DividendGoalSnapshot,
  SimulationErrorResponse,
  TaxMode,
} from './dividend-goal-schema';

import type {
  DividendGoalAssumptions,
  DividendGoalRequest,
  DividendGoalResponse,
  DividendGoalResult,
  DividendGoalSeriesPoint,
  SimulationErrorResponse,
} from './dividend-goal-schema';

export type DividendGoalScenarioCompareRequest = {
  target_annual_dividend: number;
  monthly_contribution: number;
  horizon_years: number;
};

export type DividendGoalScenario = {
  scenario_id: string;
  name: string;
  assumptions: DividendGoalAssumptions;
  result: DividendGoalResult;
  series: DividendGoalSeriesPoint[];
};

export type DividendGoalScenarioCompareResponse = {
  scenarios: DividendGoalScenario[];
};

export type DividendGoalShockDelta = {
  achieved_year_delay: number | null;
  end_annual_dividend_gap: number | null;
};

export type DividendGoalShockResponse = {
  base: DividendGoalResponse;
  shocked: DividendGoalResponse;
  delta: DividendGoalShockDelta;
};

export type SimulationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SimulationErrorResponse };
