/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import * as roadmapStore from '../../stores/roadmap-store';
import type { DividendGoalResponse } from '../../lib/simulations/types';

vi.mock('recharts', () => {
  const wrap =
    (label: string) =>
    ({ children }: { children?: React.ReactNode }) =>
      <div data-testid={`recharts-${label}`}>{children}</div>;

  return {
    CartesianGrid: wrap('CartesianGrid'),
    Line: wrap('Line'),
    LineChart: wrap('LineChart'),
    ReferenceLine: (props: { ['data-testid']?: string }) => (
      <div data-testid={props['data-testid'] ?? 'recharts-ReferenceLine'} />
    ),
    ResponsiveContainer: wrap('ResponsiveContainer'),
    Tooltip: wrap('Tooltip'),
    XAxis: wrap('XAxis'),
    YAxis: wrap('YAxis'),
  };
});

import { RoadmapChart } from './roadmap-chart';

vi.mock('../../stores/roadmap-store');

const setupStore = (response: DividendGoalResponse | null, isLoading = false) => {
  vi.mocked(roadmapStore.useRoadmapStore).mockImplementation((selector) => {
    const state = {
      input: null,
      response,
      error: null,
      isLoading,
      runRoadmap: vi.fn(),
    };
    return selector(state);
  });
};

describe('RoadmapChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(null, false);
  });

  it('seriesがある場合に折れ線グラフを表示する', () => {
    const response: DividendGoalResponse = {
      result: { target_annual_dividend: 1000000 },
      series: [
        { year: 2026, annual_dividend: 200000 },
        { year: 2027, annual_dividend: 300000 },
      ],
    };

    setupStore(response, false);

    render(<RoadmapChart />);

    expect(screen.getByTestId('roadmap-series-chart')).toBeInTheDocument();
    expect(screen.getByTestId('roadmap-target-line')).toBeInTheDocument();
  });

  it('seriesがない場合はプレースホルダーを表示する', () => {
    render(<RoadmapChart />);

    expect(
      screen.getByText('配当推移のデータがまだありません')
    ).toBeInTheDocument();
  });

  it('ロード中は計算中を表示する', () => {
    setupStore(null, true);

    render(<RoadmapChart />);

    expect(screen.getByText('計算中...')).toBeInTheDocument();
  });
});
