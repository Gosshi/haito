/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';

import { RoadmapShockView } from './roadmap-shock-view';
import type { DividendGoalShockRequest } from '../../lib/simulations/types';
import { FEATURE_KEYS, type FeatureKey } from '../../lib/access/feature-catalog';
import { getBillingStatus } from '../../lib/access/billing-status';
import { runDividendGoalShock } from '../../lib/api/simulations';
import { useFeatureAccessStore } from '../../stores/feature-access-store';
import { useRoadmapShockStore } from '../../stores/roadmap-shock-store';

vi.mock('../../lib/access/billing-status');
vi.mock('../../lib/api/simulations');

vi.mock('./roadmap-shock-form', () => ({
  RoadmapShockForm: () => <div data-testid="roadmap-shock-form" />,
}));

vi.mock('./roadmap-shock-summary', () => ({
  RoadmapShockSummary: () => <div data-testid="roadmap-shock-summary" />,
}));

vi.mock('./roadmap-shock-chart', () => ({
  RoadmapShockChart: () => <div data-testid="roadmap-shock-chart" />,
}));

const buildLocks = (locked = false) =>
  FEATURE_KEYS.reduce((acc, feature) => {
    acc[feature] = {
      feature,
      locked,
      reason: 'unknown',
    };
    return acc;
  }, {} as Record<FeatureKey, { feature: FeatureKey; locked: boolean; reason: 'forbidden' | 'unknown' }>);

const mockInput: DividendGoalShockRequest = {
  target_annual_dividend: 120000,
  monthly_contribution: 20000,
  horizon_years: 5,
  assumptions: {
    yield_rate: 3.5,
    dividend_growth_rate: 2.1,
    tax_mode: 'after_tax',
  },
  shock: {
    year: new Date().getFullYear(),
    rate: 10,
  },
};

describe('RoadmapShockView flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeatureAccessStore.setState({
      status: null,
      locks: buildLocks(false),
    });
    useRoadmapShockStore.setState({
      input: null,
      response: null,
      error: null,
      isLoading: false,
    });
  });

  it('無料→有料のフローでロック状態が切り替わる', async () => {
    vi.mocked(getBillingStatus)
      .mockResolvedValueOnce({ plan: 'free', is_active: false })
      .mockResolvedValueOnce({ plan: 'premium', is_active: true });
    vi.mocked(runDividendGoalShock).mockResolvedValueOnce({
      ok: false,
      error: {
        error: {
          code: 'FORBIDDEN',
          message: 'Access forbidden.',
          details: null,
        },
      },
    });

    render(<RoadmapShockView />);

    expect(screen.getByText('ストレステスト入力')).toBeInTheDocument();

    await act(async () => {
      await useRoadmapShockStore.getState().runShock(mockInput);
    });

    expect(screen.getByText('Proで利用できます')).toBeInTheDocument();
    expect(screen.queryByText('ストレステスト入力')).toBeNull();

    await act(async () => {
      await useFeatureAccessStore.getState().refreshStatus();
    });

    expect(screen.getByText('ストレステスト入力')).toBeInTheDocument();
  });
});
