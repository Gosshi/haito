/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import RoadmapPage from './page';
import { useRoadmapStore } from '../../../stores/roadmap-store';
import * as settingsStore from '../../../stores/settings-store';
import * as roadmapSimulation from '../../../lib/simulations/roadmap';
import type { DividendGoalResponse } from '../../../lib/simulations/types';

vi.mock('../../../stores/settings-store');
vi.mock('../../../lib/simulations/roadmap');

const setupSettingsStore = () => {
  vi.mocked(settingsStore.useSettingsStore).mockImplementation((selector) => {
    const state = {
      settings: null,
      isLoading: false,
      error: null,
      fetchSettings: vi.fn(),
      updateSettings: vi.fn(),
      clearSettings: vi.fn(),
    };
    return selector(state);
  });
};

const fillRequiredInputs = () => {
  fireEvent.change(screen.getByLabelText('年間配当ゴール（円）'), {
    target: { value: '1000000' },
  });
  fireEvent.change(screen.getByLabelText('毎月の追加投資額（円）'), {
    target: { value: '30000' },
  });
  fireEvent.change(screen.getByLabelText('期間（年）'), {
    target: { value: '5' },
  });
  fireEvent.change(screen.getByLabelText('想定利回り（%）'), {
    target: { value: '3.5' },
  });
  fireEvent.change(screen.getByLabelText('想定増配率（%）'), {
    target: { value: '2' },
  });
};

describe('RoadmapPage integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupSettingsStore();
    useRoadmapStore.setState({
      input: null,
      response: null,
      error: null,
      isLoading: false,
    });
  });

  it('入力後にロードマップ結果が更新される', async () => {
    const response: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 180000, current_yield_rate: 3.2 },
      result: {
        target_annual_dividend: 1000000,
        achieved_in_year: 2030,
        end_annual_dividend: 1300000,
      },
      series: [
        { year: 2026, annual_dividend: 180000 },
        { year: 2027, annual_dividend: 240000 },
      ],
      recommendations: [{ title: '調整A', delta: '+1%' }],
    };

    vi.mocked(roadmapSimulation.runRoadmapSimulation).mockResolvedValueOnce({
      ok: true,
      data: response,
    });

    render(<RoadmapPage />);

    fillRequiredInputs();
    fireEvent.change(screen.getByLabelText('税区分'), {
      target: { value: 'after_tax' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ロードマップを試算' }));

    expect(await screen.findByText('配当ゴール')).toBeInTheDocument();
    expect(screen.getByText('¥1,000,000')).toBeInTheDocument();
    expect(screen.getByTestId('roadmap-series-chart')).toBeInTheDocument();
    expect(screen.getAllByTestId('roadmap-recommendation-card')).toHaveLength(1);
  });

  it('シミュレーション失敗時にエラーメッセージが表示される', async () => {
    vi.mocked(roadmapSimulation.runRoadmapSimulation).mockResolvedValueOnce({
      ok: false,
      error: {
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid input',
          details: null,
        },
      },
    });

    render(<RoadmapPage />);

    fillRequiredInputs();
    fireEvent.change(screen.getByLabelText('税区分'), {
      target: { value: 'after_tax' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'ロードマップを試算' }));

    expect(await screen.findByText('Invalid input')).toBeInTheDocument();
  });
});
