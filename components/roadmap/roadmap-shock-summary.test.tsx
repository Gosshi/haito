/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { DividendGoalShockResponse } from '../../lib/simulations/types';
import * as shockStore from '../../stores/roadmap-shock-store';
import { RoadmapShockSummary } from './roadmap-shock-summary';

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

describe('RoadmapShockSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(null, false);
  });

  it('差分データがある場合は遅れ年数と期末配当差分を表示する', () => {
    const response: DividendGoalShockResponse = {
      base: { result: {}, series: [] },
      shocked: { result: {}, series: [] },
      delta: {
        achieved_year_delay: 2,
        end_annual_dividend_gap: 50000,
      },
    };

    setupStore(response, false);

    render(<RoadmapShockSummary />);

    expect(screen.getByText('達成年数の遅れ')).toBeInTheDocument();
    expect(screen.getByText('2年')).toBeInTheDocument();
    expect(screen.getByText('期末配当差分')).toBeInTheDocument();
    expect(screen.getByText('¥50,000')).toBeInTheDocument();
  });

  it('結果未取得時は未実行の表示を行う', () => {
    render(<RoadmapShockSummary />);

    expect(
      screen.getByText('ストレステスト結果がまだありません')
    ).toBeInTheDocument();
  });

  it('ロード中は計算中を表示する', () => {
    setupStore(null, true);

    render(<RoadmapShockSummary />);

    expect(screen.getByText('計算中...')).toBeInTheDocument();
  });
});
