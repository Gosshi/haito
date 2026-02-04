import { describe, it, expect } from 'vitest';

import { buildRoadmapHistoryCreateRequest } from './build-request';
import type { DividendGoalRequest, DividendGoalResponse } from '../simulations/types';

describe('buildRoadmapHistoryCreateRequest', () => {
  const input: DividendGoalRequest = {
    target_annual_dividend: 1200000,
    monthly_contribution: 30000,
    horizon_years: 5,
    assumptions: {
      yield_rate: 3.5,
      dividend_growth_rate: 2.0,
      tax_mode: 'after_tax',
    },
  };

  it('入力とレスポンスから履歴リクエストを組み立てる', () => {
    const response: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 180000, current_yield_rate: 3.2 },
      result: { target_annual_dividend: 1200000, achieved_in_year: 2030 },
      series: [{ year: 2026, annual_dividend: 180000 }],
    };

    const result = buildRoadmapHistoryCreateRequest(input, response);

    expect(result).toEqual({
      input,
      summary: {
        snapshot: response.snapshot ?? null,
        result: response.result ?? null,
      },
      series: response.series ?? [],
    });
  });

  it('入力またはレスポンスが欠けている場合はnullを返す', () => {
    const response: DividendGoalResponse = { snapshot: null, result: null };

    expect(buildRoadmapHistoryCreateRequest(null, response)).toBeNull();
    expect(buildRoadmapHistoryCreateRequest(input, null)).toBeNull();
  });

  it('seriesが欠けている場合は空配列として扱う', () => {
    const response: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 180000 },
      result: { target_annual_dividend: 1200000 },
    };

    const result = buildRoadmapHistoryCreateRequest(input, response);

    expect(result).toEqual({
      input,
      summary: {
        snapshot: response.snapshot ?? null,
        result: response.result ?? null,
      },
      series: [],
    });
  });
});
