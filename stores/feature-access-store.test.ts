import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useFeatureAccessStore } from './feature-access-store';
import { getBillingStatus } from '../lib/access/billing-status';
import type { FeatureKey } from '../lib/access/feature-catalog';

vi.mock('../lib/access/billing-status');

const buildLocks = (locked = false) =>
  ({
    stress_test: {
      feature: 'stress_test',
      locked,
      reason: 'unknown',
    },
    anxiety_relief: {
      feature: 'anxiety_relief',
      locked,
      reason: 'unknown',
    },
  }) satisfies Record<FeatureKey, {
    feature: FeatureKey;
    locked: boolean;
    reason: 'forbidden' | 'unknown';
  }>;

describe('useFeatureAccessStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeatureAccessStore.setState({
      status: null,
      locks: buildLocks(false),
    });
  });

  it('ロック状態を保持できる', () => {
    useFeatureAccessStore.getState().lockFeature('stress_test', 'forbidden');

    const state = useFeatureAccessStore.getState();
    expect(state.locks.stress_test.locked).toBe(true);
    expect(state.locks.stress_test.reason).toBe('forbidden');
  });

  it('有料プランの場合はロックを解除する', async () => {
    useFeatureAccessStore.setState({
      status: null,
      locks: buildLocks(true),
    });

    vi.mocked(getBillingStatus).mockResolvedValue({
      plan: 'premium',
      is_active: true,
    });

    await useFeatureAccessStore.getState().refreshStatus();

    const state = useFeatureAccessStore.getState();
    expect(state.status).toEqual({ plan: 'premium', is_active: true });
    expect(state.locks.stress_test.locked).toBe(false);
    expect(state.locks.anxiety_relief.locked).toBe(false);
  });

  it('無料プランの場合はロックを維持する', async () => {
    useFeatureAccessStore.setState({
      status: null,
      locks: buildLocks(true),
    });

    vi.mocked(getBillingStatus).mockResolvedValue({
      plan: 'free',
      is_active: false,
    });

    await useFeatureAccessStore.getState().refreshStatus();

    const state = useFeatureAccessStore.getState();
    expect(state.status).toEqual({ plan: 'free', is_active: false });
    expect(state.locks.stress_test.locked).toBe(true);
  });
});
