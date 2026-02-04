/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import * as scenarioCompareStore from '../../stores/scenario-compare-store';
import type { DividendGoalScenarioCompareResponse } from '../../lib/simulations/types';
import { ScenarioCompareChart } from './scenario-compare-chart';

vi.mock('recharts', () => {
  const wrap =
    (label: string) =>
    ({ children }: { children?: React.ReactNode }) =>
      <div data-testid={`recharts-${label}`}>{children}</div>;

  return {
    CartesianGrid: wrap('CartesianGrid'),
    Line: (props: { ['data-testid']?: string; children?: React.ReactNode }) => (
      <div data-testid={props['data-testid'] ?? 'recharts-Line'}>
        {props.children}
      </div>
    ),
    LineChart: wrap('LineChart'),
    ResponsiveContainer: wrap('ResponsiveContainer'),
    Tooltip: wrap('Tooltip'),
    XAxis: wrap('XAxis'),
    YAxis: wrap('YAxis'),
  };
});

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

describe('ScenarioCompareChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(null, false);
  });

  it('3シナリオの線と名称を表示する', () => {
    const response: DividendGoalScenarioCompareResponse = {
      scenarios: [
        {
          scenario_id: 'stable',
          name: '安定型',
          assumptions: {
            yield_rate: 3.5,
            dividend_growth_rate: 1.5,
            tax_mode: 'after_tax',
          },
          result: {},
          series: [{ year: 2026, annual_dividend: 200000 }],
        },
        {
          scenario_id: 'high',
          name: '高配当型',
          assumptions: {
            yield_rate: 4.5,
            dividend_growth_rate: 1.0,
            tax_mode: 'after_tax',
          },
          result: {},
          series: [{ year: 2026, annual_dividend: 260000 }],
        },
        {
          scenario_id: 'growth',
          name: '増配重視型',
          assumptions: {
            yield_rate: 3.0,
            dividend_growth_rate: 3.0,
            tax_mode: 'after_tax',
          },
          result: {},
          series: [{ year: 2026, annual_dividend: 220000 }],
        },
      ],
    };

    setupStore(response, false);

    render(<ScenarioCompareChart />);

    expect(screen.getByTestId('scenario-compare-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('scenario-compare-line')).toHaveLength(3);
    expect(screen.getByText('安定型')).toBeInTheDocument();
    expect(screen.getByText('高配当型')).toBeInTheDocument();
    expect(screen.getByText('増配重視型')).toBeInTheDocument();
  });

  it('seriesがない場合はプレースホルダーを表示する', () => {
    render(<ScenarioCompareChart />);

    expect(
      screen.getByText('比較データがまだありません')
    ).toBeInTheDocument();
  });

  it('ロード中は計算中を表示する', () => {
    setupStore(null, true);

    render(<ScenarioCompareChart />);

    expect(screen.getByText('計算中...')).toBeInTheDocument();
  });
});
