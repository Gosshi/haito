/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import * as scenarioCompareStore from '../../stores/scenario-compare-store';
import type { DividendGoalScenarioCompareResponse } from '../../lib/simulations/types';
import { ScenarioCompareSummary } from './scenario-compare-summary';

vi.mock('../../stores/scenario-compare-store');

const setupStore = (
  response: DividendGoalScenarioCompareResponse | null,
  isLoading = false
) => {
  vi.mocked(scenarioCompareStore.useScenarioCompareStore).mockImplementation(
    (selector) => {
      const state = {
        input: null,
        response,
        error: null,
        isLoading,
        runScenarioCompare: vi.fn(),
        setInputFromRoadmap: vi.fn(),
      };
      return selector(state);
    }
  );
};

describe('ScenarioCompareSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(null, false);
  });

  afterEach(() => {
    if (vi.isFakeTimers()) {
      vi.useRealTimers();
    }
  });

  it('達成年数と期末配当をシナリオ別に表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const response: DividendGoalScenarioCompareResponse = {
      scenarios: [
        {
          scenario_id: 'stable',
          name: '安定型',
          assumptions: {
            yield_rate: 3.5,
            dividend_growth_rate: 2.0,
            tax_mode: 'after_tax',
          },
          result: {
            achieved_in_year: 2029,
            end_annual_dividend: 900000,
          },
          series: [],
        },
        {
          scenario_id: 'growth',
          name: '増配重視型',
          assumptions: {
            yield_rate: 3.0,
            dividend_growth_rate: 3.0,
            tax_mode: 'after_tax',
          },
          result: {
            achieved: false,
            achieved_in_year: null,
            end_annual_dividend: 1200000,
          },
          series: [],
        },
      ],
    };

    setupStore(response, false);

    render(<ScenarioCompareSummary />);

    expect(screen.getByText('安定型')).toBeInTheDocument();
    expect(screen.getByText('3年')).toBeInTheDocument();
    expect(screen.getByText('¥900,000')).toBeInTheDocument();
    expect(screen.getByText('増配重視型')).toBeInTheDocument();
    expect(screen.getByText('未達')).toBeInTheDocument();
    expect(screen.getByText('¥1,200,000')).toBeInTheDocument();
  });

  it('結果がない場合はプレースホルダーを表示する', () => {
    render(<ScenarioCompareSummary />);

    expect(
      screen.getByText('比較結果がまだありません')
    ).toBeInTheDocument();
  });

  it('ロード中は計算中を表示する', () => {
    setupStore(null, true);

    render(<ScenarioCompareSummary />);

    expect(screen.getByText('計算中...')).toBeInTheDocument();
  });
});
