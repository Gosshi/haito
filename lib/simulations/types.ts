export {
  accountTypeSchema,
  dividendGoalAssumptionsSchema,
  dividendGoalRecommendationSchema,
  dividendGoalRequestSchema,
  dividendGoalResponseSchema,
  dividendGoalResultSchema,
  dividendGoalSeriesPointSchema,
  dividendGoalShockDeltaSchema,
  dividendGoalShockRequestSchema,
  dividendGoalShockResponseSchema,
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
  DividendGoalShockDelta,
  DividendGoalShock,
  DividendGoalShockRequest,
  DividendGoalShockResponse,
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

export type SimulationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SimulationErrorResponse };
