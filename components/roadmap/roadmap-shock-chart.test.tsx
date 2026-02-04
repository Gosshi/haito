/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import type { DividendGoalShockResponse } from '../../lib/simulations/types';
import * as shockStore from '../../stores/roadmap-shock-store';
import { RoadmapShockChart } from './roadmap-shock-chart';

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

vi.mock('../../stores/roadmap-shock-store');

const setupStore = (
  response: DividendGoalShockResponse | null,
  isLoading = false
) => {
  vi.mocked(shockStore.useRoadmapShockStore).mockImplementation((selector) => {
    const state = {
      input: null,
      response,
      error: null,
      isLoading,
      runShock: vi.fn(),
    };
    return selector(state);
  });
};

describe('RoadmapShockChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(null, false);
  });

  it('base/shockedの系列と凡例を表示する', () => {
    const response: DividendGoalShockResponse = {
      base: {
        result: {},
        series: [
          { year: 2026, annual_dividend: 200000 },
          { year: 2027, annual_dividend: 240000 },
        ],
      },
      shocked: {
        result: {},
        series: [
          { year: 2026, annual_dividend: 180000 },
          { year: 2027, annual_dividend: 210000 },
        ],
      },
      delta: {
        achieved_year_delay: 1,
        end_annual_dividend_gap: 30000,
      },
    };

    setupStore(response, false);

    render(<RoadmapShockChart />);

    expect(screen.getByTestId('roadmap-shock-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('roadmap-shock-line')).toHaveLength(2);
    expect(screen.getByText('通常')).toBeInTheDocument();
    expect(screen.getByText('減配後')).toBeInTheDocument();
  });

  it('データがない場合はプレースホルダーを表示する', () => {
    render(<RoadmapShockChart />);

    expect(
      screen.getByText('ストレステストの比較データがまだありません')
    ).toBeInTheDocument();
  });

  it('ロード中は計算中を表示する', () => {
    setupStore(null, true);

    render(<RoadmapShockChart />);

    expect(screen.getByText('計算中...')).toBeInTheDocument();
  });
});
