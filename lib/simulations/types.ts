export type TaxMode = 'pretax' | 'after_tax';

export type DividendGoalAssumptions = {
  yield_rate: number;
  dividend_growth_rate: number;
  tax_mode: TaxMode;
};

export type DividendGoalRequest = {
  target_annual_dividend: number;
  monthly_contribution: number;
  horizon_years: number;
  assumptions: DividendGoalAssumptions;
};

export type DividendGoalScenarioCompareRequest = {
  target_annual_dividend: number;
  monthly_contribution: number;
  horizon_years: number;
};

export type DividendGoalSnapshot = {
  current_annual_dividend?: number | null;
  current_yield_rate?: number | null;
};

export type DividendGoalSeriesPoint = {
  year: number;
  annual_dividend: number;
};

export type DividendGoalResult = {
  achieved?: boolean;
  achieved_in_year?: number | null;
  gap_now?: number | null;
  end_annual_dividend?: number | null;
  target_annual_dividend?: number | null;
};

export type DividendGoalRecommendation = Record<string, unknown>;

export type DividendGoalResponse = {
  snapshot?: DividendGoalSnapshot | null;
  result?: DividendGoalResult | null;
  series?: DividendGoalSeriesPoint[];
  recommendations?: DividendGoalRecommendation[];
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

export type DividendGoalShock = {
  year: number;
  rate: number;
};

export type DividendGoalShockRequest = DividendGoalRequest & {
  shock: DividendGoalShock;
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

export type SimulationErrorResponse = {
  error: {
    code: string;
    message: string;
    details: unknown | null;
  };
};

export type SimulationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: SimulationErrorResponse };
