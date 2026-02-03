import type {
  DividendGoalRequest,
  DividendGoalResponse,
  DividendGoalSeriesPoint,
  SimulationResult,
} from './types';

const buildSeries = (input: DividendGoalRequest): DividendGoalSeriesPoint[] => {
  const currentYear = new Date().getFullYear();
  const years = Math.max(input.horizon_years, 0);
  const target = Math.max(input.target_annual_dividend, 0);
  const step = years > 0 ? target / years : target;

  return Array.from({ length: years + 1 }, (_, index) => ({
    year: currentYear + index,
    annual_dividend: Math.round(step * index),
  }));
};

export const runDividendGoalSimulationMock = async (
  input: DividendGoalRequest
): Promise<SimulationResult<DividendGoalResponse>> => {
  const series = buildSeries(input);
  const lastPoint = series.at(-1);
  const endAnnualDividend = lastPoint?.annual_dividend ?? 0;
  const achieved = endAnnualDividend >= input.target_annual_dividend;

  return {
    ok: true,
    data: {
      snapshot: {
        current_annual_dividend: series[0]?.annual_dividend ?? 0,
        current_yield_rate: input.assumptions.yield_rate,
      },
      result: {
        achieved,
        achieved_in_year: achieved ? lastPoint?.year ?? null : null,
        end_annual_dividend: endAnnualDividend,
        target_annual_dividend: input.target_annual_dividend,
      },
      series,
      recommendations: [],
    },
  };
};
