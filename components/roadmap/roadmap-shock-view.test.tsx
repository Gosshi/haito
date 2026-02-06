/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { FeatureKey } from '../../lib/access/feature-catalog';
import * as featureStore from '../../stores/feature-access-store';
import * as shockStore from '../../stores/roadmap-shock-store';
import { RoadmapShockView } from './roadmap-shock-view';

vi.mock('../../stores/feature-access-store');
vi.mock('../../stores/roadmap-shock-store');

vi.mock('./roadmap-shock-form', () => ({
  RoadmapShockForm: () => <div data-testid="roadmap-shock-form" />,
}));

vi.mock('./roadmap-shock-summary', () => ({
  RoadmapShockSummary: () => <div data-testid="roadmap-shock-summary" />,
}));

vi.mock('./roadmap-shock-chart', () => ({
  RoadmapShockChart: () => <div data-testid="roadmap-shock-chart" />,
}));

const buildLocks = (locked: boolean) =>
  ({
    stress_test: {
      feature: 'stress_test',
      locked,
      reason: locked ? 'forbidden' : 'unknown',
    },
    anxiety_relief: {
      feature: 'anxiety_relief',
      locked: false,
      reason: 'unknown',
    },
  }) satisfies Record<FeatureKey, {
    feature: FeatureKey;
    locked: boolean;
    reason: 'forbidden' | 'unknown';
  }>;

const setupFeatureStore = (locked: boolean) => {
  vi.mocked(featureStore.useFeatureAccessStore).mockImplementation((selector) => {
    const state = {
      status: null,
      locks: buildLocks(locked),
      refreshStatus: vi.fn(),
      lockFeature: vi.fn(),
      unlockFeature: vi.fn(),
    };
    return selector(state);
  });
};

const setupShockStore = (error: { error: { code: string } } | null) => {
  vi.mocked(shockStore.useRoadmapShockStore).mockImplementation((selector) => {
    const state = {
      input: null,
      response: null,
      error,
      isLoading: false,
      runShock: vi.fn(),
    };
    return selector(state);
  });
};

describe('RoadmapShockView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupFeatureStore(false);
    setupShockStore(null);
  });

  it('見出しと説明文を表示する', () => {
    render(<RoadmapShockView />);

    expect(
      screen.getByText('想定外が起きた場合のロードマップ')
    ).toBeInTheDocument();
    expect(
      screen.getByText('一時的な減配が起きた場合の影響を確認できます。')
    ).toBeInTheDocument();
  });

  it('ロック状態の場合はロック表示を行う', () => {
    setupFeatureStore(true);

    render(<RoadmapShockView />);

    expect(screen.getByText('Proで利用できます')).toBeInTheDocument();
  });

  it('ロックされていない場合はフォームと結果を表示する', () => {
    render(<RoadmapShockView />);

    expect(screen.getByTestId('roadmap-shock-form')).toBeInTheDocument();
    expect(screen.getByTestId('roadmap-shock-summary')).toBeInTheDocument();
    expect(screen.getByTestId('roadmap-shock-chart')).toBeInTheDocument();
  });
});
