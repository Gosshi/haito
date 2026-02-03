/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import * as roadmapStore from '../../stores/roadmap-store';
import { RoadmapSummary } from './roadmap-summary';
import type { DividendGoalResponse } from '../../lib/simulations/types';

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

describe('RoadmapSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(null, false);
  });

  afterEach(() => {
    if (vi.isFakeTimers()) {
      vi.useRealTimers();
    }
  });

  it('KPIカードを表示する', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const response: DividendGoalResponse = {
      snapshot: { current_annual_dividend: 180000, current_yield_rate: 3.2 },
      result: {
        target_annual_dividend: 1200000,
        achieved_in_year: 2030,
        end_annual_dividend: 1500000,
      },
    };

    setupStore(response, false);

    render(<RoadmapSummary />);

    expect(screen.getByText('現在の年間配当')).toBeInTheDocument();
    expect(screen.getByText('¥180,000')).toBeInTheDocument();
    expect(screen.getByText('現状利回り: 3.2%')).toBeInTheDocument();
    expect(screen.getByText('配当ゴール')).toBeInTheDocument();
    expect(screen.getByText('¥1,200,000')).toBeInTheDocument();
    expect(screen.getByText('ゴール到達までの年数')).toBeInTheDocument();
    expect(screen.getByText('4年')).toBeInTheDocument();
    expect(screen.getByText('最終年の年間配当（試算）')).toBeInTheDocument();
    expect(screen.getByText('¥1,500,000')).toBeInTheDocument();
  });

  it('未達の場合は未達表現を表示する', () => {
    const response: DividendGoalResponse = {
      result: {
        achieved: false,
        achieved_in_year: null,
        target_annual_dividend: 1200000,
      },
    };

    setupStore(response, false);

    render(<RoadmapSummary />);

    expect(screen.getByText('ゴール到達までの年数')).toBeInTheDocument();
    expect(screen.getByText('未達')).toBeInTheDocument();
  });

  it('結果がない場合はプレースホルダーを表示する', () => {
    render(<RoadmapSummary />);

    expect(
      screen.getByText('ロードマップ結果がまだありません')
    ).toBeInTheDocument();
  });

  it('ロード中は計算中を表示する', () => {
    setupStore(null, true);

    render(<RoadmapSummary />);

    expect(screen.getByText('計算中...')).toBeInTheDocument();
  });
});
