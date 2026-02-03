/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import * as roadmapStore from '../../stores/roadmap-store';
import { RoadmapLevers } from './roadmap-levers';
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

describe('RoadmapLevers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupStore(null, false);
  });

  it('recommendationsを2件まで表示する', () => {
    const response: DividendGoalResponse = {
      recommendations: [
        { title: '調整A', delta: '+1.0%' },
        { title: '調整B', delta: '+0.5%' },
        { title: '調整C', delta: '+0.2%' },
      ],
    };

    setupStore(response, false);

    render(<RoadmapLevers />);

    const cards = screen.getAllByTestId('roadmap-recommendation-card');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveTextContent('調整A');
    expect(cards[1]).toHaveTextContent('調整B');
  });

  it('recommendationsがない場合はプレースホルダーを表示する', () => {
    render(<RoadmapLevers />);

    expect(screen.getByText('レバーの結果がまだありません')).toBeInTheDocument();
  });

  it('ロード中は計算中を表示する', () => {
    setupStore(null, true);

    render(<RoadmapLevers />);

    expect(screen.getByText('計算中...')).toBeInTheDocument();
  });
});
