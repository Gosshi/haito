'use client';

import { create } from 'zustand';

import type { BillingStatus } from '../lib/access/billing-status';
import { getBillingStatus } from '../lib/access/billing-status';
import { FEATURE_KEYS, type FeatureKey } from '../lib/access/feature-catalog';

export type FeatureLockState = {
  feature: FeatureKey;
  locked: boolean;
  reason: 'forbidden' | 'unknown';
};

export type FeatureAccessState = {
  status: BillingStatus | null;
  locks: Record<FeatureKey, FeatureLockState>;
  refreshStatus: () => Promise<void>;
  lockFeature: (feature: FeatureKey, reason: FeatureLockState['reason']) => void;
  unlockFeature: (feature: FeatureKey) => void;
};

const buildLocks = (locked = false): Record<FeatureKey, FeatureLockState> => {
  return FEATURE_KEYS.reduce((acc, feature) => {
    acc[feature] = {
      feature,
      locked,
      reason: 'unknown',
    };
    return acc;
  }, {} as Record<FeatureKey, FeatureLockState>);
};

export const useFeatureAccessStore = create<FeatureAccessState>((set) => ({
  status: null,
  locks: buildLocks(false),
  refreshStatus: async () => {
    try {
      const status = await getBillingStatus();
      set((state) => ({
        status,
        locks:
          status.plan === 'premium' && status.is_active
            ? buildLocks(false)
            : state.locks,
      }));
    } catch {
      // keep current state on failure
    }
  },
  lockFeature: (feature, reason) => {
    set((state) => ({
      locks: {
        ...state.locks,
        [feature]: {
          feature,
          locked: true,
          reason,
        },
      },
    }));
  },
  unlockFeature: (feature) => {
    set((state) => ({
      locks: {
        ...state.locks,
        [feature]: {
          feature,
          locked: false,
          reason: 'unknown',
        },
      },
    }));
  },
}));
