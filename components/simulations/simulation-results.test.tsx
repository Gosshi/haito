/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationResults } from './simulation-results';
import * as simulationStore from '../../stores/simulation-store';
import type {
  DividendGoalResponse,
  SimulationErrorResponse,
} from '../../lib/simulations/types';

vi.mock('../../stores/simulation-store');

const setupStore = (
  response: DividendGoalResponse | null,
  error: SimulationErrorResponse | null = null
) => {
  vi.mocked(simulationStore.useSimulationStore).mockImplementation((selector) => {
    const state = {
      input: null,
      response,
      error,
      isLoading: false,
      runSimulation: vi.fn(),
    };
    return selector(state);
  });
};

describe('SimulationResults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(null, null);
  });

  it('KPIカードを返却範囲で表示する', () => {
    const response: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 180000 },
      result: {
        target_annual_dividend: 1200000,
        achieved_in_year: 2030,
        end_annual_dividend: 1500000,
      },
    };

    setupStore(response, null);

    render(<SimulationResults />);

    expect(screen.getByText('現在の年間配当')).toBeInTheDocument();
    expect(screen.getByText('¥180,000')).toBeInTheDocument();
    expect(screen.getByText('目標年間配当')).toBeInTheDocument();
    expect(screen.getByText('¥1,200,000')).toBeInTheDocument();
    expect(screen.getByText('達成年')).toBeInTheDocument();
    expect(screen.getByText('2030年')).toBeInTheDocument();
    expect(screen.getByText('期末年間配当')).toBeInTheDocument();
    expect(screen.getByText('¥1,500,000')).toBeInTheDocument();
  });

  it('seriesがある場合に折れ線グラフを表示する', () => {
    const response: DividendGoalResponse = {
      series: [
        { year: 1, annual_dividend: 200000 },
        { year: 2, annual_dividend: 300000 },
      ],
    };

    setupStore(response, null);

    render(<SimulationResults />);

    expect(screen.getByText('配当推移')).toBeInTheDocument();
    expect(screen.getByTestId('simulation-series-chart')).toBeInTheDocument();
  });

  it('recommendationsを順序保持で表示する', () => {
    const response: DividendGoalResponse = {
      recommendations: [
        { title: '推奨A', message: '調整してください' },
        { title: '推奨B', message: '条件を見直してください' },
      ],
    };

    setupStore(response, null);

    render(<SimulationResults />);

    const recommendationCards = screen.getAllByTestId('recommendation-card');
    expect(recommendationCards).toHaveLength(2);
    expect(recommendationCards[0]).toHaveTextContent('推奨A');
    expect(recommendationCards[1]).toHaveTextContent('推奨B');
  });

  it('結果がない場合はプレースホルダーを表示する', () => {
    render(<SimulationResults />);

    expect(
      screen.getByText('シミュレーション結果がまだありません')
    ).toBeInTheDocument();
  });
});
